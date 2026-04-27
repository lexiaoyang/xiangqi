import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("迷宫应用", () => {
  it("战役大厅展示品牌与商店入口", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole("heading", { name: /迷宫大冒险/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "商店" })).toBeInTheDocument();
    expect(screen.getByText(/成人策略迷宫/)).toBeInTheDocument();
    expect(screen.getByText(/VIP BENEFITS/)).toBeInTheDocument();
    expect(screen.getByText(/今日战术挑战/)).toBeInTheDocument();
    expect(screen.getByText(/大师总分/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "活动中心" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "看广告领体力" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "看广告得提示" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /奖励中心/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "商店" }));
    expect(screen.getByRole("heading", { name: /战术商店/ })).toBeInTheDocument();
    expect(screen.getByText(/战术工具/)).toBeInTheDocument();
    expect(screen.getByText(/VIP 权益/)).toBeInTheDocument();
  });
});
