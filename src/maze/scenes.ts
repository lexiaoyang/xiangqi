import type { SceneMechanic } from "./types";

export type SceneId = "forest" | "candy" | "ocean" | "space";

export type SceneDefinition = {
  id: SceneId;
  label: string;
  short: string;
  playerEmoji: string;
  goalEmoji: string;
  collectEmoji?: string;
  tagline: string;
  /** 核心玩法，与 UI 皮肤解耦，后续加场景主要改这里 */
  mechanic: SceneMechanic;
  /** collect 专用：需收集数量 */
  collectCount?: number;
  /** gust：占通路格比例上限 */
  gustRatio?: number;
};

export const SCENES: SceneDefinition[] = [
  {
    id: "forest",
    label: "森林探险",
    short: "森林",
    playerEmoji: "🐻",
    goalEmoji: "🏕️",
    tagline: "经典迷宫：看准路线，一步一脚印走到营地。",
    mechanic: "standard"
  },
  {
    id: "candy",
    label: "糖果王国",
    short: "糖果",
    playerEmoji: "🍬",
    goalEmoji: "🏰",
    collectEmoji: "🍭",
    tagline: "收集玩法：先捡齐糖果，城堡大门才会打开。",
    mechanic: "collect",
    collectCount: 5
  },
  {
    id: "ocean",
    label: "海底洋流",
    short: "洋流",
    playerEmoji: "🐠",
    goalEmoji: "🐚",
    tagline: "洋流格：踩上去会被再推一小段，像被海浪带着走。",
    mechanic: "gust",
    gustRatio: 0.12
  },
  {
    id: "space",
    label: "星际跳跃",
    short: "星门",
    playerEmoji: "🚀",
    goalEmoji: "🌙",
    tagline: "星门：两处光门成对，踩进去会跳到另一端。",
    mechanic: "portal"
  }
];

export function sceneById(id: SceneId): SceneDefinition {
  return SCENES.find((s) => s.id === id) ?? SCENES[0];
}

export const WIN_PHRASES = ["太厉害啦！", "终点打卡成功！", "迷宫小达人！", "通关！掌声响起来~", "路线选得真漂亮！"];

export const ENCOURAGEMENT = [
  "每一步都算数，慢慢走也很棒！",
  "撞墙也没关系，换个方向就好~",
  "迷宫像拼图，多试几次就熟啦。",
  "眼睛看远一点，路会更清楚哦。",
  "手指轻轻滑，小步也能到终点！",
  "今天的小探险家，加油！"
];
