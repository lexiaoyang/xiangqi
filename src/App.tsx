import { CampaignShell } from "./CampaignShell";
import LegacyMazeApp from "./LegacyMazeApp";

/** 设为 `false` 时回退旧版单页迷宫（与战役存档共存） */
const CAMPAIGN_ENABLED = import.meta.env.VITE_CAMPAIGN_ENABLED !== "false";

export default function App() {
  if (!CAMPAIGN_ENABLED) {
    return <LegacyMazeApp />;
  }
  return <CampaignShell />;
}
