import type { ApiResult } from "./api";
import { ok } from "./api";
import { readWalletCache } from "./storage";
import type { AssetAmount, UserSession, WalletSnapshot } from "./types";

export type WalletUiState = {
  state: WalletSnapshot["syncState"];
  label: string;
  detail: string;
  canMutate: boolean;
};

export function walletUiState(wallet: WalletSnapshot | null): WalletUiState {
  if (!wallet) return { state: "failed", label: "钱包未同步", detail: "资产服务暂不可用", canMutate: false };
  if (wallet.syncState === "restricted") return { state: "restricted", label: "钱包受限", detail: "账号状态限制资产变更", canMutate: false };
  if (wallet.syncState === "failed") return { state: "failed", label: "钱包离线", detail: "显示缓存余额，暂不可变更", canMutate: false };
  if (wallet.syncState === "syncing") return { state: "syncing", label: "钱包同步中", detail: "资产变更处理中", canMutate: false };
  if (wallet.syncState === "cached") return { state: "cached", label: "缓存余额", detail: "网络恢复后同步", canMutate: false };
  return { state: "online", label: "钱包在线", detail: "资产已同步", canMutate: true };
}

export function canAfford(wallet: WalletSnapshot | null, costs: AssetAmount[]): boolean {
  if (!walletUiState(wallet).canMutate) return false;
  return costs.every((cost) => (wallet?.balances[cost.kind] ?? 0) >= cost.amount);
}

export function projectWallet(wallet: WalletSnapshot, deltas: AssetAmount[], syncState: WalletSnapshot["syncState"] = wallet.syncState): WalletSnapshot {
  const balances = { ...wallet.balances };
  for (const delta of deltas) {
    balances[delta.kind] = Math.max(0, (balances[delta.kind] ?? 0) + delta.amount);
  }
  return {
    ...wallet,
    balances,
    syncState,
    ledgerCursor: String(Number(wallet.ledgerCursor || "0") + 1),
    updatedAt: new Date().toISOString()
  };
}

export function cachedWalletForSession(session: UserSession | null): ApiResult<WalletSnapshot | null> {
  const cached = readWalletCache();
  if (!session || !cached || cached.userId !== session.profile.userId) return ok(null);
  return ok(cached);
}
