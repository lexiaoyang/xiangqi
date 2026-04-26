export class SandboxPaymentProvider {
  constructor({ secret = "sandbox-payment-secret" } = {}) {
    this.secret = secret;
  }
  createClientAction(order) {
    return { kind: "sdk", provider: "sandbox", payload: { orderId: order.id, amount: order.amount, currency: order.currency } };
  }
  verifyReceipt(receipt = {}) {
    if (receipt.invalid || receipt.signature === "bad") return { ok: false, status: "verification_failed" };
    return { ok: true, status: "paid", providerTransactionId: receipt.transactionId || `sandbox_${Date.now()}` };
  }
}

export class SandboxAdProvider {
  constructor({ secret = "sandbox-ad-secret" } = {}) {
    this.secret = secret;
  }
  verifyCompletion(result = {}) {
    if (result.failed || result.completed === false) return { ok: false, reason: "ad_not_completed" };
    return { ok: true, providerImpressionId: result.impressionId || `imp_${Date.now()}` };
  }
}
