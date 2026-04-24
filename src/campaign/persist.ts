import { CAMPAIGN_PACK_VERSION } from "./constants";
import type { CampaignSaveV1, ToolId } from "./types";

const STORAGE_KEY = "campaign:save:v1";

const defaultSave = (): CampaignSaveV1 => ({
  schema: "campaign:v1",
  packVersion: CAMPAIGN_PACK_VERSION,
  maxUnlockedLevel: 1,
  perLevel: {},
  coins: 120,
  stamina: 24,
  toolsUnlocked: { hint: false, undo: false },
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
      toolsUnlocked: { ...defaultSave().toolsUnlocked, ...p.toolsUnlocked }
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

const STAMINA_REGEN_MS = 300_000;
const STAMINA_MAX = 30;

export function regenStamina(save: CampaignSaveV1): CampaignSaveV1 {
  const now = Date.now();
  const dt = now - save.lastStaminaTs;
  const add = Math.floor(dt / STAMINA_REGEN_MS);
  if (add <= 0) return save;
  const stamina = Math.min(STAMINA_MAX, save.stamina + add);
  return { ...save, stamina, lastStaminaTs: save.lastStaminaTs + add * STAMINA_REGEN_MS };
}

export function applyToolUnlocksFromProgress(save: CampaignSaveV1): CampaignSaveV1 {
  const m = Math.max(1, save.maxUnlockedLevel);
  const toolsUnlocked: Partial<Record<ToolId, boolean>> = { ...save.toolsUnlocked };
  if (m >= 15) toolsUnlocked.hint = true;
  if (m >= 30) toolsUnlocked.undo = true;
  return { ...save, toolsUnlocked };
}
