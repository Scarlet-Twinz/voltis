export enum RealtimeEventType {
  PAYMENT_CREATED =
    'payment.created',

  PAYMENT_PROCESSING =
    'payment.processing',

  PAYMENT_COMPLETED =
    'payment.completed',

  PAYMENT_FAILED =
    'payment.failed',

  PAYMENT_RISK_REVIEW =
    'payment.risk_review',

  PAYMENT_BLOCKED =
    'payment.blocked',

  TRANSACTION_CREATED =
    'transaction.created',

  TRANSACTION_COMPLETED =
    'transaction.completed',

  TRANSACTION_FAILED =
    'transaction.failed',

  RECONCILIATION_COMPLETED =
    'reconciliation.completed',

  WEBHOOK_DELIVERED =
    'webhook.delivered',
}
