## ADDED Requirements

### Requirement: Product Catalog
The system SHALL serve a versioned product catalog for all purchasable SKUs.

#### Scenario: Catalog loaded
- **WHEN** the shop screen opens
- **THEN** the system returns enabled SKUs, prices, currency, reward contents, purchase limits, labels, and eligibility rules

#### Scenario: Catalog unavailable
- **WHEN** the catalog request fails
- **THEN** the system hides purchase buttons and displays a retryable shop error state

### Requirement: SKU Eligibility
The system SHALL evaluate whether a user can purchase each SKU.

#### Scenario: First purchase pack eligibility
- **WHEN** a user already bought a one-time pack
- **THEN** the system marks that SKU as unavailable for the user

#### Scenario: Region restricted SKU
- **WHEN** a SKU is not available in the user's region or channel
- **THEN** the system excludes the SKU from the returned catalog

### Requirement: Order Creation
The system SHALL create a server-side order before invoking any payment provider.

#### Scenario: Create order
- **WHEN** the user confirms a purchase
- **THEN** the system creates an order with user id, SKU id, amount, currency, provider, idempotency key, and status `created`

#### Scenario: Duplicate order request
- **WHEN** the client repeats order creation with the same idempotency key
- **THEN** the system returns the original order without creating another order

### Requirement: Payment Provider Adapter
The system SHALL route payments through a provider adapter abstraction.

#### Scenario: Provider payment started
- **WHEN** an order is created for a supported provider
- **THEN** the adapter returns provider-specific payment parameters and a normalized client action

#### Scenario: Provider unavailable
- **WHEN** the configured provider is disabled or unhealthy
- **THEN** the system rejects new orders for that provider and returns a user-safe unavailable message

### Requirement: Receipt Verification
The system SHALL verify provider receipts or payment notifications before delivery.

#### Scenario: Valid receipt
- **WHEN** the provider returns a valid receipt for an unpaid order
- **THEN** the system marks the order paid and records the verified provider transaction id

#### Scenario: Invalid receipt
- **WHEN** receipt verification fails
- **THEN** the system does not deliver rewards and marks the order verification failed

### Requirement: Idempotent Fulfillment
The system SHALL deliver purchased contents exactly once per paid order.

#### Scenario: First fulfillment
- **WHEN** a paid order has not been fulfilled
- **THEN** the system writes wallet ledger entries, marks the order fulfilled, and returns delivered contents

#### Scenario: Duplicate fulfillment callback
- **WHEN** the same paid order is fulfilled again
- **THEN** the system returns the existing fulfillment result without adding assets again

### Requirement: Pending Order Recovery
The system SHALL allow users to recover pending or paid-but-unfulfilled orders.

#### Scenario: App restarted after payment
- **WHEN** the app restarts and finds a pending order
- **THEN** the system refreshes order status and resumes verification or fulfillment

#### Scenario: Manual restore purchases
- **WHEN** a user taps restore purchases
- **THEN** the system queries recoverable provider transactions and fulfills any valid unfulfilled orders

### Requirement: Refund and Chargeback Handling
The system SHALL process refunds, chargebacks, and provider reversals.

#### Scenario: Refund received
- **WHEN** the provider reports a refund for a fulfilled order
- **THEN** the system marks the order refunded and records compensating wallet ledger entries where applicable

#### Scenario: Duplicate refund notification
- **WHEN** the provider sends the same refund notification multiple times
- **THEN** the system processes it once and returns an idempotent success response

### Requirement: Reconciliation
The system SHALL support daily reconciliation between internal orders and provider transactions.

#### Scenario: Missing internal fulfillment
- **WHEN** reconciliation finds a provider-paid transaction without internal fulfillment
- **THEN** the system creates a reconciliation issue and schedules safe fulfillment review

#### Scenario: Amount mismatch
- **WHEN** reconciliation finds mismatched amount, currency, or SKU metadata
- **THEN** the system flags the order for manual review and prevents automatic delivery

### Requirement: Payment Risk Controls
The system SHALL enforce risk controls for purchase abuse and abnormal order behavior.

#### Scenario: Rapid failed payments
- **WHEN** a user exceeds failed payment thresholds
- **THEN** the system rate-limits new purchase attempts for that user and device

#### Scenario: Suspicious refund pattern
- **WHEN** a user repeatedly refunds consumable purchases
- **THEN** the system flags the account for review and can restrict future purchases

### Requirement: Payment UX Safeguards
The system SHALL require explicit confirmation before paid purchases.

#### Scenario: Paid SKU selected
- **WHEN** the user taps a paid SKU
- **THEN** the system shows SKU contents, price, currency, refund note, and confirm/cancel actions before invoking payment

#### Scenario: User cancels confirmation
- **WHEN** the user cancels the confirmation dialog
- **THEN** the system does not create an order or invoke the provider
