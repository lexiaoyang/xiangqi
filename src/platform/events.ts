import { createRequestId, err, ok, type ApiResult } from "./api";
import { DEFAULT_REMOTE_CONFIG, isModuleEnabled } from "./config";
import { mockPlatformProviders } from "./mockProviders";
import type { PlatformProviders } from "./providers";
import { readEventCenterCache, writeEventCenterCache } from "./storage";
import type { EventCenterSnapshot, EventTaskKind, LiveEventDefinition, LiveEventTask, RemoteConfig, UserSession, WalletSnapshot } from "./types";

export function eventStatus(event: LiveEventDefinition, now = Date.now()): "upcoming" | "active" | "ended" | "disabled" {
  if (!event.enabled) return "disabled";
  if (Date.parse(event.startsAt) > now) return "upcoming";
  if (Date.parse(event.endsAt) <= now) return "ended";
  return "active";
}

export function activeEvents(config: RemoteConfig, now = Date.now()): LiveEventDefinition[] {
  if (!isModuleEnabled(config, "events")) return [];
  return config.events.filter((event) => eventStatus(event, now) === "active").sort((a, b) => b.priority - a.priority);
}

export function buildEventCenter(userId: string, config: RemoteConfig = DEFAULT_REMOTE_CONFIG): EventCenterSnapshot {
  const cached = readEventCenterCache();
  const baseEvents = cached?.userId === userId ? cached.events : config.events;
  const events = baseEvents.map((event) => ({ ...event, tasks: event.tasks.map((task) => ({ ...task })) }));
  return {
    userId,
    events,
    claimableCount: events.reduce((sum, event) => sum + event.tasks.filter((task) => task.state === "claimable").length, 0),
    updatedAt: new Date().toISOString()
  };
}

export async function loadEventCenter(session: UserSession, config: RemoteConfig = DEFAULT_REMOTE_CONFIG): Promise<ApiResult<EventCenterSnapshot>> {
  const snapshot = buildEventCenter(session.profile.userId, config);
  return ok(writeEventCenterCache(snapshot));
}

export function ingestEventProgress(
  session: UserSession,
  kind: EventTaskKind,
  amount = 1,
  config: RemoteConfig = DEFAULT_REMOTE_CONFIG
): ApiResult<EventCenterSnapshot> {
  if (amount > 20) return err("VALIDATION_FAILED", "活动进度异常，已进入复核。", false, { kind, amount });
  const current = buildEventCenter(session.profile.userId, config);
  const events = current.events.map((event) => ({
    ...event,
    tasks: event.tasks.map((task) => progressTask(task, kind, amount))
  }));
  return ok(writeEventCenterCache({ ...current, events, claimableCount: countClaimable(events), updatedAt: new Date().toISOString() }));
}

export async function claimEventTaskReward(
  session: UserSession,
  eventId: string,
  taskId: string,
  providers: PlatformProviders = mockPlatformProviders
): Promise<ApiResult<{ event: LiveEventDefinition; task: LiveEventTask; wallet: WalletSnapshot }>> {
  const current = buildEventCenter(session.profile.userId);
  const event = current.events.find((item) => item.id === eventId);
  const task = event?.tasks.find((item) => item.id === taskId);
  if (!event || !task) return err("NOT_FOUND", "活动任务不存在。");
  if (task.state === "claimed") return err("ALREADY_CLAIMED", "活动奖励已领取。");
  if (task.state !== "claimable") return err("VALIDATION_FAILED", "活动任务尚未完成。");

  const wallet = await providers.wallet.grant(
    session,
    { source: "event", sourceId: `${eventId}:${taskId}`, deltas: task.rewards },
    { requestId: createRequestId("eventclaim"), idempotencyKey: `event:${session.profile.userId}:${eventId}:${taskId}` }
  );
  if (!wallet.ok) return wallet;

  const events = current.events.map((item) =>
    item.id === event.id ? { ...item, tasks: item.tasks.map((t) => (t.id === task.id ? { ...t, state: "claimed" as const } : t)) } : item
  );
  writeEventCenterCache({ ...current, events, claimableCount: countClaimable(events), updatedAt: new Date().toISOString() });
  return ok({ event, task: { ...task, state: "claimed" }, wallet: wallet.data });
}

function progressTask(task: LiveEventTask, kind: EventTaskKind, amount: number): LiveEventTask {
  if (task.kind !== kind || task.state === "claimed" || task.state === "expired") return task;
  const progress = Math.min(task.target, task.progress + amount);
  return { ...task, progress, state: progress >= task.target ? "claimable" : task.state };
}

function countClaimable(events: LiveEventDefinition[]): number {
  return events.reduce((sum, event) => sum + event.tasks.filter((task) => task.state === "claimable").length, 0);
}

export function eventTimeLeftLabel(event: LiveEventDefinition, now = Date.now()): string {
  const ms = Math.max(0, Date.parse(event.endsAt) - now);
  const days = Math.floor(ms / 86_400_000);
  if (days > 0) return `${days}天`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours > 0) return `${hours}小时`;
  return `${Math.max(1, Math.ceil(ms / 60_000))}分钟`;
}
