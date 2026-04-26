import { describe, expect, it } from "vitest";
import { buildAnalyticsStats, normalizeAnalyticsEvents } from "./analytics.mjs";

describe("server analytics helpers", () => {
  it("normalizes valid batches and keeps client timestamps", () => {
    const result = normalizeAnalyticsEvents(
      {
        events: [
          {
            name: "page_click",
            source: "page",
            userId: "user_1",
            page: "hub",
            data: { target: "shop", ignored: { nested: true }, long: "x".repeat(180) },
            createdAt: "2026-01-01T00:00:00.000Z"
          }
        ]
      },
      "2026-01-01T00:00:01.000Z"
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.events).toHaveLength(1);
    expect(result.events[0].createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(result.events[0].receivedAt).toBe("2026-01-01T00:00:01.000Z");
    expect(result.events[0].data.ignored).toBeUndefined();
    expect(result.events[0].data.long).toHaveLength(160);
  });

  it("rejects events without source", () => {
    const result = normalizeAnalyticsEvents({ name: "page_click" });
    expect(result).toEqual({ ok: false, error: "analytics_source_required" });
  });

  it("aggregates totals, names, pages and recent samples", () => {
    const stats = buildAnalyticsStats(
      [
        { name: "page_view", source: "page", userId: "u1", page: "hub", receivedAt: "2026-01-01T00:00:00.000Z" },
        { name: "page_click", source: "page", userId: "u1", page: "hub", receivedAt: "2026-01-01T00:00:01.000Z" },
        { name: "level_complete", source: "client", userId: "u2", page: "play", receivedAt: "2026-01-01T00:00:02.000Z" }
      ],
      { limit: 2 }
    );

    expect(stats.total).toBe(3);
    expect(stats.uniqueUsers).toBe(2);
    expect(stats.byName.page_click).toBe(1);
    expect(stats.byPage.hub).toBe(2);
    expect(stats.bySource.page).toBe(2);
    expect(stats.recent.map((event) => event.name)).toEqual(["level_complete", "page_click"]);
  });
});
