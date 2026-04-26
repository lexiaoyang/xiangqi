# liveops-and-analytics-platform Specification

## Purpose
TBD - created by archiving change user-payments-ads-rewards-platform. Update Purpose after archive.
## Requirements
### Requirement: Remote Configuration
The system SHALL load versioned remote configuration for monetization, rewards, UI entry points, and feature flags.

#### Scenario: Config loaded
- **WHEN** the client starts successfully online
- **THEN** the system loads remote config, validates schema version, and caches the accepted config

#### Scenario: Config load fails
- **WHEN** remote config cannot be fetched or validated
- **THEN** the system uses the last valid cache or bundled defaults and records a config fallback event

### Requirement: Feature Flags
The system SHALL support feature flags for payment, ads, reward center, account binding, experiments, and risky entry points.

#### Scenario: Feature disabled
- **WHEN** a feature flag is disabled for the user
- **THEN** the client hides the associated entry point and prevents API mutations for that feature

#### Scenario: Kill switch activated
- **WHEN** an emergency kill switch is enabled
- **THEN** the client disables the affected module without requiring an app release

### Requirement: A/B Experiments
The system SHALL assign users to experiments deterministically and persist assignment.

#### Scenario: User assigned experiment
- **WHEN** a user qualifies for an active experiment
- **THEN** the system assigns a variant by stable user id or device id and returns the same variant on later sessions

#### Scenario: Experiment ended
- **WHEN** an experiment is no longer active
- **THEN** the system stops assigning new users and returns control config unless configured to freeze variant

### Requirement: Segmentation
The system SHALL evaluate operational segments using safe user, device, channel, version, region, progress, and payer attributes.

#### Scenario: Payer segment
- **WHEN** a user has completed a paid purchase
- **THEN** the system can include the user in payer-specific configuration

#### Scenario: Unsupported segment expression
- **WHEN** config contains an invalid segment expression
- **THEN** the system rejects the config version during validation

### Requirement: Campaign Scheduling
The system SHALL support scheduled live events, limited-time offers, gift codes, and reward tracks.

#### Scenario: Event starts
- **WHEN** server time enters an event schedule window
- **THEN** eligible users receive the event configuration and UI entry point

#### Scenario: Event ends
- **WHEN** server time exits an event schedule window
- **THEN** the event entry point is hidden or marked ended according to config

### Requirement: Analytics Event Contract
The system SHALL define a stable analytics event schema for product, economy, ads, payment, reward, account, and error events.

#### Scenario: Level complete event
- **WHEN** a user completes a level
- **THEN** the system emits an event with user id scope, level id, steps, stars, duration, scene, tools used, and active monetization config version

#### Scenario: Purchase funnel event
- **WHEN** the user views SKU, confirms order, starts payment, succeeds, fails, or receives fulfillment
- **THEN** the system emits correlated purchase funnel events with order id and SKU id

### Requirement: Economy Analytics
The system SHALL track asset sources, sinks, balances, and reward/purchase attribution.

#### Scenario: Asset source event
- **WHEN** coins or items are granted
- **THEN** the system records source type, source id, ledger id, amount, balance after, and config version

#### Scenario: Asset sink event
- **WHEN** coins or items are consumed
- **THEN** the system records sink type, sink id, amount, balance after, and failure reason if consumption fails

### Requirement: Operational Dashboards Data
The system SHALL expose data contracts needed for operational dashboards.

#### Scenario: Daily monetization dashboard
- **WHEN** analytics events are processed
- **THEN** the system can compute DAU, payer conversion, ARPDAU, ad impressions, rewarded completion rate, purchase success rate, and reward claim rate

#### Scenario: Level health dashboard
- **WHEN** level events are processed
- **THEN** the system can compute clear rate, retry rate, average steps, average duration, and tool usage by level

### Requirement: Config Audit and Rollback
The system SHALL audit all remote config changes and support rollback.

#### Scenario: Config published
- **WHEN** an operator publishes config
- **THEN** the system records author, diff, validation result, target segment, rollout percent, and timestamp

#### Scenario: Config rollback
- **WHEN** an operator rolls back a config version
- **THEN** the system serves the previous valid config version and records the rollback reason

### Requirement: Error Reporting
The system SHALL report module errors using normalized error codes.

#### Scenario: Payment provider error
- **WHEN** a payment provider fails
- **THEN** the system emits a normalized payment error event with provider, order id, user-safe category, and retryability

#### Scenario: Reward claim error
- **WHEN** a reward claim fails
- **THEN** the system emits a reward error event with reward source, claim id, error code, and idempotency key

### Requirement: Privacy-Safe Analytics
The system SHALL avoid sending raw personal data in analytics events.

#### Scenario: Analytics payload built
- **WHEN** the client builds an analytics event
- **THEN** the payload excludes raw phone, email, payment credential, receipt body, and advertising id unless consent and policy allow

#### Scenario: Consent revoked
- **WHEN** the user revokes analytics consent
- **THEN** the client stops non-essential analytics emission and records only necessary operational events

