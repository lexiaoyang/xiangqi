import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("迷宫应用", () => {
  it("展示难度选择与换迷宫按钮", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole("heading", { name: "走迷宫" })).toBeInTheDocument();
    const select = screen.getByLabelText("选择难度");
    await user.selectOptions(select, "medium");
    expect(screen.getByRole("button", { name: "换一张迷宫" })).toBeInTheDocument();
  });
});
