# user-account-platform Specification

## Purpose
TBD - created by archiving change user-payments-ads-rewards-platform. Update Purpose after archive.
## Requirements
### Requirement: Guest Identity
The system SHALL create a durable guest identity before the user enters campaign gameplay.

#### Scenario: First launch creates guest
- **WHEN** a new user opens the game without an existing local identity
- **THEN** the system creates a guest user id, device id, session token, and local profile cache

#### Scenario: Returning guest restores identity
- **WHEN** a user opens the game with a valid cached guest identity
- **THEN** the system restores the same user id without creating a duplicate profile

### Requirement: Account Binding
The system SHALL allow a guest user to bind to at least one durable login method without losing local progress.

#### Scenario: Guest binds account
- **WHEN** a guest completes a supported binding flow
- **THEN** the system links the login credential to the existing user id and keeps campaign progress and assets

#### Scenario: Credential already bound
- **WHEN** a user attempts to bind a credential already linked to another account
- **THEN** the system rejects the bind and explains that the credential is already in use

### Requirement: Session Management
The system SHALL manage authenticated sessions with refresh, expiry, and logout behavior.

#### Scenario: Session refresh succeeds
- **WHEN** the access token is expired and the refresh token is valid
- **THEN** the system refreshes the access token without interrupting gameplay

#### Scenario: Session refresh fails
- **WHEN** both access and refresh tokens are invalid
- **THEN** the system falls back to offline-safe mode and prompts the user to sign in again before cloud or purchase actions

### Requirement: Cloud Save
The system SHALL sync campaign progress, unlocked levels, stars, settings, and non-authoritative gameplay state to cloud storage for bound users.

#### Scenario: Upload local progress after binding
- **WHEN** a guest binds an account for the first time
- **THEN** the system uploads local campaign progress and merges it into the cloud profile

#### Scenario: Download progress on new device
- **WHEN** a bound user signs in on a new device
- **THEN** the system downloads cloud progress and applies it to the local cache

### Requirement: Progress Merge
The system SHALL merge campaign progress deterministically across local and cloud saves.

#### Scenario: Merge level unlocks
- **WHEN** local and cloud saves have different unlocked levels
- **THEN** the merged save uses the highest unlocked level

#### Scenario: Merge per-level stars
- **WHEN** local and cloud saves have different stars for the same level
- **THEN** the merged save keeps the best star value for that level

### Requirement: Asset Wallet
The system SHALL expose a wallet view for coins, stamina, consumable tools, tickets, and premium entitlements.

#### Scenario: Wallet refresh
- **WHEN** the client requests the wallet for a signed-in user
- **THEN** the system returns current balances, last ledger cursor, and pending reconciliation state

#### Scenario: Offline wallet display
- **WHEN** wallet refresh fails due to network issues
- **THEN** the system displays cached balances with an offline indicator and blocks purchase-dependent mutations

### Requirement: Device Management
The system SHALL associate multiple devices with a user account and track the latest trusted device metadata.

#### Scenario: New device login
- **WHEN** a user signs in from a new device
- **THEN** the system records the device id, platform, app version, first seen time, and last seen time

#### Scenario: Device revoked
- **WHEN** a user revokes a device
- **THEN** the system invalidates sessions associated with that device

### Requirement: Account Recovery
The system SHALL provide account recovery paths for bound users.

#### Scenario: Recover by login credential
- **WHEN** a user signs in with a previously bound credential
- **THEN** the system restores the same account, cloud progress, wallet, and entitlements

#### Scenario: Guest cannot be recovered remotely
- **WHEN** a user loses all local guest identity data without binding
- **THEN** the system explains that the guest account cannot be recovered remotely

### Requirement: Account Deletion
The system SHALL allow users to request account deletion and SHALL stop commercial actions after deletion is scheduled.

#### Scenario: Deletion requested
- **WHEN** a user confirms account deletion
- **THEN** the system marks the account deletion pending, revokes sessions, and disables purchases, ads rewards, and reward claims

#### Scenario: Deleted user opens game
- **WHEN** a deleted account attempts to sign in
- **THEN** the system denies access to the deleted account and offers guest restart

### Requirement: Audit Trail
The system SHALL record security-relevant user account events.

#### Scenario: Binding audit
- **WHEN** a login credential is bound or unbound
- **THEN** the system records user id, device id, event type, timestamp, and request id

#### Scenario: Session audit
- **WHEN** a session is created, refreshed, revoked, or expires abnormally
- **THEN** the system records the session event for investigation

