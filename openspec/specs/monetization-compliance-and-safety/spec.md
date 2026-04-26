# monetization-compliance-and-safety Specification

## Purpose
TBD - created by archiving change user-payments-ads-rewards-platform. Update Purpose after archive.
## Requirements
### Requirement: Consent Gate
The system SHALL collect and persist required privacy and commercial consent before enabling relevant SDK-backed features.

#### Scenario: Consent required before SDK init
- **WHEN** a user has not accepted required privacy terms
- **THEN** the system does not initialize non-essential analytics, ad, or payment SDKs

#### Scenario: Consent accepted
- **WHEN** the user accepts required terms
- **THEN** the system records consent version, timestamp, locale, and device id

### Requirement: Consent Revocation
The system SHALL allow users to revoke optional consent.

#### Scenario: Analytics consent revoked
- **WHEN** the user revokes optional analytics consent
- **THEN** the system disables non-essential analytics and updates local and server consent state

#### Scenario: Ads personalization revoked
- **WHEN** the user revokes personalized ads consent
- **THEN** the system requests non-personalized ads or disables placements that require personalization

### Requirement: Age and Minor Controls
The system SHALL support age declaration and minor-safe monetization restrictions.

#### Scenario: Minor user detected
- **WHEN** the user is classified as a minor by age declaration or channel policy
- **THEN** the system applies minor-safe restrictions for payments, ads, analytics, and playtime where required

#### Scenario: Age unknown
- **WHEN** age status is unknown in a jurisdiction requiring age gates
- **THEN** the system uses the safest commercial restrictions until age status is resolved

### Requirement: Payment Confirmation
The system SHALL require clear paid purchase confirmation and prohibit misleading purchase flows.

#### Scenario: Purchase confirmation shown
- **WHEN** a user initiates a paid SKU purchase
- **THEN** the UI shows real price, currency, SKU contents, provider, and cancel action before payment

#### Scenario: Purchase cancelled
- **WHEN** the user cancels before provider payment starts
- **THEN** the system does not create a payable provider transaction

### Requirement: Ad Labeling
The system SHALL label ad entry points and ad rewards clearly.

#### Scenario: Rewarded ad CTA
- **WHEN** a rewarded ad button is visible
- **THEN** the UI labels that watching an ad is required and shows the reward amount

#### Scenario: Interstitial about to show
- **WHEN** an interstitial is shown after gameplay
- **THEN** the ad presentation is distinguishable from game UI according to provider and channel rules

### Requirement: Data Minimization
The system SHALL store and transmit only data necessary for account, commerce, reward, safety, and analytics purposes.

#### Scenario: Payment receipt stored
- **WHEN** a receipt is verified
- **THEN** the system stores provider transaction ids and verification results without exposing raw receipt data to client analytics

#### Scenario: User profile stored
- **WHEN** a user profile is persisted
- **THEN** the system stores only required profile fields and separates sensitive credential metadata from gameplay data

### Requirement: Audit Logging
The system SHALL audit sensitive commercial and account actions.

#### Scenario: Paid order state changes
- **WHEN** an order changes state
- **THEN** the system records actor, previous state, next state, request id, provider transaction id if present, and timestamp

#### Scenario: Manual grant
- **WHEN** an operator grants assets manually
- **THEN** the system records operator id, user id, reason, ledger entries, approval state, and timestamp

### Requirement: Fraud Signals
The system SHALL collect fraud signals for payment, ads, rewards, and account abuse.

#### Scenario: Suspicious ad claims
- **WHEN** a user submits repeated ad completion claims without matching provider events
- **THEN** the system records fraud signals and can block reward grants

#### Scenario: Wallet anomaly
- **WHEN** wallet balance changes without matching ledger events
- **THEN** the system flags the account and prevents further commercial mutations until reconciliation

### Requirement: Rate Limiting
The system SHALL rate-limit sensitive endpoints.

#### Scenario: Reward claim spam
- **WHEN** a device sends excessive reward claim requests
- **THEN** the system throttles requests and returns a retry-after response

#### Scenario: Login attempts exceeded
- **WHEN** a user or device exceeds login failure thresholds
- **THEN** the system rate-limits further attempts and records the event

### Requirement: User Data Rights
The system SHALL support account deletion, data export, and commercial data retention rules.

#### Scenario: Data export requested
- **WHEN** a bound user requests data export
- **THEN** the system prepares account, progress, wallet summary, orders, consent records, and reward records in a portable format

#### Scenario: Deletion retention
- **WHEN** account deletion is processed
- **THEN** the system removes or anonymizes personal data while retaining legally required payment and audit records

### Requirement: Safe Degradation
The system SHALL degrade commercial modules without blocking core gameplay.

#### Scenario: Compliance service unavailable
- **WHEN** compliance state cannot be verified
- **THEN** the system disables payment, ad, and reward mutations but allows non-commercial gameplay with local cache

#### Scenario: Commercial kill switch enabled
- **WHEN** a global commercial kill switch is enabled
- **THEN** the system hides payment and ad entry points and leaves campaign play accessible

