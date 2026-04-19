type LogLevel = "info" | "warn" | "error";

export interface TelemetryEvent {
  name: string;
  level?: LogLevel;
  at?: string;
  data?: Record<string, unknown>;
}

export const logEvent = (event: TelemetryEvent): void => {
  const payload = {
    at: event.at ?? new Date().toISOString(),
    level: event.level ?? "info",
    name: event.name,
    data: event.data ?? {}
  };
  // eslint-disable-next-line no-console
  console.log("[telemetry]", payload);
};

export const withPerf = <T>(name: string, fn: () => T): T => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  logEvent({ name, data: { durationMs: Number((end - start).toFixed(2)) } });
  return result;
};
