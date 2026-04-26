## ADDED Requirements

### Requirement: Server Ad Placements
The backend SHALL serve ad placements and offer eligibility from server configuration and user state.

#### Scenario: Client loads ad placements
- **WHEN** the client requests ad placements
- **THEN** the backend returns enabled placements, rewards, cooldown, daily cap, session cap, and eligibility state

### Requirement: Show Token Issuance
The backend SHALL issue short-lived rewarded ad show tokens.

#### Scenario: User requests show token
- **WHEN** the user is eligible for a rewarded ad
- **THEN** the backend creates a token tied to user, placement, reward, expiry, and request id

#### Scenario: User is capped or restricted
- **WHEN** the user hits cooldown, daily cap, consent restriction, minor restriction, or provider disable state
- **THEN** the backend refuses to issue a show token and returns a safe reason

### Requirement: Ad Completion Verification
The backend SHALL verify ad completion before granting rewards.

#### Scenario: Provider confirms completed ad
- **WHEN** a valid provider result or sandbox completion is submitted for a show token
- **THEN** the backend verifies token validity, completion, expiry, and user match before granting rewards

#### Scenario: Duplicate completion callback
- **WHEN** the same show token completion is submitted again
- **THEN** the backend returns the original reward result without duplicate ledger grant

### Requirement: Pending Ad Reward Retry
The backend SHALL support safe retry when ad completion succeeds but client reward delivery fails.

#### Scenario: Client reconnects after completion
- **WHEN** the client has a completed but unacknowledged ad reward
- **THEN** the backend returns pending reward status and allows idempotent claim until token expiry
