## ADDED Requirements

### Requirement: Audit Logging
The backend SHALL persist audit events for high-value and compliance-sensitive operations.

#### Scenario: High-value operation occurs
- **WHEN** account binding, account deletion, payment state change, asset mutation, reward claim, ad reward, consent change, or manual grant occurs
- **THEN** the backend writes an audit event with request id, user id, device id, type, payload, and timestamp

### Requirement: Privacy Consent Enforcement
The backend SHALL enforce privacy consent and commercial restrictions.

#### Scenario: Consent not accepted
- **WHEN** the user has not accepted required privacy terms
- **THEN** the backend blocks non-essential analytics, personalized ads, and restricted commercial modules

#### Scenario: User revokes optional consent
- **WHEN** optional analytics or ad personalization consent is revoked
- **THEN** the backend persists the consent state and stops future restricted processing

### Requirement: Minor And Safety Restrictions
The backend SHALL apply age and safety gates to payment, ads, rewards, analytics, and experiments.

#### Scenario: User is minor
- **WHEN** consent state marks user as minor
- **THEN** the backend restricts configured commercial modules and returns safe reasons to the client

### Requirement: Rate Limiting And Fraud Signals
The backend SHALL rate-limit sensitive endpoints and record fraud signals.

#### Scenario: Excessive reward claim attempts
- **WHEN** a user repeatedly attempts invalid reward claims or impossible progress
- **THEN** the backend rate limits the user and records fraud signals for review

### Requirement: Data Export And Deletion
The backend SHALL support user data export and deletion workflows.

#### Scenario: User requests data export
- **WHEN** the user requests data export
- **THEN** the backend returns a privacy-safe export of account, device, wallet, orders, rewards, consents, and audit metadata

#### Scenario: User requests data deletion
- **WHEN** the user requests deletion
- **THEN** the backend disables commercial actions, revokes sessions, and schedules or executes deletion according to policy

### Requirement: Operational Metrics
The backend SHALL expose privacy-safe operational metrics for platform health.

#### Scenario: Operator views metrics
- **WHEN** backend metrics are collected
- **THEN** the system reports payment success rate, ad reward completion, reward claim rate, ledger issues, API errors, and sync failures without exposing raw personal data
