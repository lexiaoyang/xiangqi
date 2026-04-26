import { describe, expect, it } from "vitest";
import { describeAnalyticsTarget } from "./pageAnalytics";

describe("page analytics target extraction", () => {
  it("describes clickable controls without leaking input values", () => {
    document.body.innerHTML = `
      <button aria-label="打开商店" data-analytics-id="shop-entry">商店</button>
      <input id="nickname" name="nickname" value="secret-player-name" />
    `;

    const button = document.querySelector("button");
    const input = document.querySelector("input");

    expect(describeAnalyticsTarget(button)).toMatchObject({
      tag: "button",
      analytics_id: "shop-entry",
      label: "打开商店"
    });
    expect(describeAnalyticsTarget(input)).toMatchObject({
      tag: "input",
      input_type: "text",
      name: "nickname"
    });
    expect(Object.values(describeAnalyticsTarget(input) ?? {})).not.toContain("secret-player-name");
  });
});
