export var RealtimeEventType;
(function (RealtimeEventType) {
    RealtimeEventType["PAYMENT_CREATED"] = "payment.created";
    RealtimeEventType["PAYMENT_PROCESSING"] = "payment.processing";
    RealtimeEventType["PAYMENT_COMPLETED"] = "payment.completed";
    RealtimeEventType["PAYMENT_FAILED"] = "payment.failed";
    RealtimeEventType["PAYMENT_RISK_REVIEW"] = "payment.risk_review";
    RealtimeEventType["PAYMENT_BLOCKED"] = "payment.blocked";
    RealtimeEventType["TRANSACTION_CREATED"] = "transaction.created";
    RealtimeEventType["TRANSACTION_COMPLETED"] = "transaction.completed";
    RealtimeEventType["TRANSACTION_FAILED"] = "transaction.failed";
    RealtimeEventType["RECONCILIATION_COMPLETED"] = "reconciliation.completed";
    RealtimeEventType["WEBHOOK_DELIVERED"] = "webhook.delivered";
})(RealtimeEventType || (RealtimeEventType = {}));
//# sourceMappingURL=realtime.events.js.map