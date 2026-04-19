import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("app e2e smoke", () => {
  it("可切换难度并看到核心按钮", async () => {
    const user = userEvent.setup();
    render(<App />);
    const select = screen.getByDisplayValue("地狱");
    await user.selectOptions(select, "easy");
    expect(screen.getByText("采用推荐")).toBeInTheDocument();
    expect(screen.getByText("导出棋谱")).toBeInTheDocument();
  });
});
