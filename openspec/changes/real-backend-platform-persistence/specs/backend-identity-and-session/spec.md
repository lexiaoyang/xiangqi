## ADDED Requirements

### Requirement: Server Authoritative Guest Identity
The backend SHALL create and persist guest users, devices, and sessions as server-side records.

#### Scenario: New guest starts game
- **WHEN** a client requests guest identity without an existing valid session
- **THEN** the backend creates a user, device, refresh session, access token, initial wallet, and audit event in persistent storage

#### Scenario: Returning guest resumes
- **WHEN** a client presents a valid refresh token
- **THEN** the backend refreshes the access token and returns the same server-side user identity

### Requirement: Account Binding
The backend SHALL bind guest accounts to provider identities without losing wallet or cloud save data.

#### Scenario: Guest binds phone or social provider
- **WHEN** the user submits a verified provider credential
- **THEN** the backend updates binding state, stores only safe provider identifiers or hashes, preserves assets and cloud save, and writes an audit event

#### Scenario: Provider already bound
- **WHEN** the provider credential belongs to another account
- **THEN** the backend requires explicit merge confirmation before changing either account

### Requirement: Device And Session Management
The backend SHALL track devices and support session revocation.

#### Scenario: User lists devices
- **WHEN** the client requests device list with a valid session
- **THEN** the backend returns devices associated with the user without exposing tokens

#### Scenario: User revokes device
- **WHEN** the user revokes a device
- **THEN** the backend marks related sessions revoked and prevents future refresh with those tokens

### Requirement: Account Deletion
The backend SHALL support account deletion requests and restrict commercial actions afterward.

#### Scenario: User requests deletion
- **WHEN** the client requests account deletion
- **THEN** the backend marks the account deleted or pending deletion, revokes sessions, blocks payments/ads/rewards, and records an audit event
