## ADDED Requirements

### Requirement: Server Cloud Save
The backend SHALL persist campaign progress as server-authoritative cloud save data.

#### Scenario: Client uploads progress
- **WHEN** the client uploads campaign progress with a valid session and base version
- **THEN** the backend validates the payload, stores a new version, and returns the updated cloud save

#### Scenario: Client downloads progress
- **WHEN** the client requests cloud save
- **THEN** the backend returns the latest saved progress for the authenticated user

### Requirement: Conflict Handling
The backend SHALL detect version conflicts and provide deterministic merge behavior.

#### Scenario: Stale client uploads progress
- **WHEN** the client upload base version is older than the stored cloud save
- **THEN** the backend rejects with a conflict response or applies the configured merge strategy and returns the result

#### Scenario: Merge keeps best progress
- **WHEN** two saves contain different cleared levels or stars
- **THEN** the merge keeps the highest unlocked level and highest per-level stars without deleting newer server data

### Requirement: Local Cache Is Not Authoritative
The frontend SHALL treat local campaign save as cache after backend sync is enabled.

#### Scenario: Local and server save differ
- **WHEN** the client has local progress and server progress exists
- **THEN** the client shows or applies the backend-approved merged save instead of silently overwriting server data

### Requirement: Offline Resilience
The system SHALL allow gameplay during transient network failure without pretending local progress is synced.

#### Scenario: Cloud save upload fails
- **WHEN** network or backend upload fails
- **THEN** the client marks sync state failed/pending and retries later without claiming server persistence succeeded
