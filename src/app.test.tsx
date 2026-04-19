import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("app e2e smoke", () => {
  it("可切换难度并展示模式页核心按钮", async () => {
    const user = userEvent.setup();
    render(<App />);
    const select = screen.getByDisplayValue("地狱");
    await user.selectOptions(select, "easy");
    expect(screen.getByText("开始对局（人机对战）")).toBeInTheDocument();
    expect(screen.getByText("更多设置")).toBeInTheDocument();
  });
});
