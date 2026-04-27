import { CAMPAIGN_PACK_VERSION } from "./constants";
import type { CampaignSaveV1, ToolId } from "./types";
import { dailyChallengeFor } from "./retention";
import { vipRegenMs, vipStaminaCap } from "./strategy";

const STORAGE_KEY = "campaign:save:v1";

const defaultSave = (): CampaignSaveV1 => ({
  schema: "campaign:v1",
  packVersion: CAMPAIGN_PACK_VERSION,
  maxUnlockedLevel: 1,
  perLevel: {},
  coins: 120,
  stamina: 24,
  toolsUnlocked: { hint: false, undo: false },
  toolInventory: {},
  vip: { points: 0 },
  seenMechanics: {},
  masteryRecords: {},
  daily: dailyChallengeFor(undefined, 1),
  streak: { count: 0, best: 0 },
  achievements: {},
  codex: {},
  lastStaminaTs: Date.now()
});

export function loadCampaignSave(): CampaignSaveV1 {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave();
    const p = JSON.parse(raw) as CampaignSaveV1;
    if (p.schema !== "campaign:v1") return defaultSave();
    return {
      ...defaultSave(),
      ...p,
      toolsUnlocked: { ...defaultSave().toolsUnlocked, ...p.toolsUnlocked },
      toolInventory: { ...defaultSave().toolInventory, ...p.toolInventory },
      vip: { ...defaultSave().vip, ...p.vip },
      seenMechanics: { ...defaultSave().seenMechanics, ...p.seenMechanics },
      masteryRecords: { ...defaultSave().masteryRecords, ...p.masteryRecords },
      daily: { ...dailyChallengeFor(undefined, p.maxUnlockedLevel ?? 1), ...p.daily },
      streak: { ...defaultSave().streak, ...p.streak },
      achievements: { ...defaultSave().achievements, ...p.achievements },
      codex: { ...defaultSave().codex, ...p.codex }
    };
  } catch {
    return defaultSave();
  }
}

export function saveCampaignSave(s: CampaignSaveV1): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function regenStamina(save: CampaignSaveV1): CampaignSaveV1 {
  const now = Date.now();
  const dt = now - save.lastStaminaTs;
  const regenMs = vipRegenMs(save.vip);
  const add = Math.floor(dt / regenMs);
  if (add <= 0) return save;
  const stamina = Math.min(vipStaminaCap(save.vip), save.stamina + add);
  return { ...save, stamina, lastStaminaTs: save.lastStaminaTs + add * regenMs };
}

export function applyToolUnlocksFromProgress(save: CampaignSaveV1): CampaignSaveV1 {
  const m = Math.max(1, save.maxUnlockedLevel);
  const toolsUnlocked: Partial<Record<ToolId, boolean>> = { ...save.toolsUnlocked };
  if (m >= 15) toolsUnlocked.hint = true;
  if (m >= 30) toolsUnlocked.undo = true;
  if (m >= 10) toolsUnlocked.scanner = true;
  if (m >= 28) toolsUnlocked.rewind = true;
  if (m >= 34) toolsUnlocked.freeze = true;
  if (m >= 44) toolsUnlocked.bridge = true;
  if (m >= 55) toolsUnlocked.decoy = true;
  if (m >= 65) toolsUnlocked.key_forge = true;
  if (m >= 90) toolsUnlocked.reveal_pulse = true;
  return { ...save, toolsUnlocked };
}

export function grantToolCharges(save: CampaignSaveV1, grants: Partial<Record<ToolId, number>>): CampaignSaveV1 {
  const toolInventory: CampaignSaveV1["toolInventory"] = { ...save.toolInventory };
  for (const [tool, amount] of Object.entries(grants) as Array<[ToolId, number]>) {
    toolInventory[tool] = Math.max(0, (toolInventory[tool] ?? 0) + amount);
  }
  return { ...save, toolInventory };
}

export function consumeToolCharge(save: CampaignSaveV1, tool: ToolId, amount = 1): CampaignSaveV1 {
  const current = save.toolInventory[tool] ?? 0;
  return { ...save, toolInventory: { ...save.toolInventory, [tool]: Math.max(0, current - amount) } };
}
