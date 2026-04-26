## ADDED Requirements

### Requirement: HTTP Platform Providers
The frontend SHALL provide HTTP-backed platform providers that call the real backend API.

#### Scenario: Real backend mode enabled
- **WHEN** `VITE_PLATFORM_API_BASE` or equivalent config points to a backend
- **THEN** the frontend uses HTTP providers for auth, wallet, payments, ads, rewards, config, compliance, and analytics

#### Scenario: Local mock mode enabled
- **WHEN** backend mode is disabled
- **THEN** the frontend may use mock providers for local development without pretending mock data is production-authoritative

### Requirement: Local Storage Cache Downgrade
The frontend SHALL treat localStorage platform data as cache instead of authority in backend mode.

#### Scenario: Backend returns wallet
- **WHEN** the frontend receives wallet data from backend
- **THEN** it updates local cache for fast boot but renders backend data as authoritative

#### Scenario: Local cache differs
- **WHEN** cached platform data conflicts with backend response
- **THEN** the frontend uses backend response and marks cache refreshed

### Requirement: Authenticated API Requests
The frontend SHALL send authenticated requests and handle token refresh.

#### Scenario: Access token expires
- **WHEN** the backend rejects a request due to expired access token
- **THEN** the frontend refreshes the session using refresh token and retries safe idempotent requests

#### Scenario: Refresh token expires
- **WHEN** refresh token is expired or revoked
- **THEN** the frontend returns to guest bootstrap or login recovery without losing unsynced local gameplay state

### Requirement: Backend Error UX
The frontend SHALL display user-safe states for backend failures.

#### Scenario: Backend unavailable
- **WHEN** platform API is unavailable
- **THEN** the frontend shows offline/cache state and disables actions requiring server authority such as purchase fulfillment and reward claims

#### Scenario: Idempotent retry succeeds
- **WHEN** a previously failed idempotent request is retried successfully
- **THEN** the frontend updates wallet/reward/order state from backend response and clears pending state

### Requirement: Environment Configuration
The project SHALL document and support environment configuration for backend and mock modes.

#### Scenario: Developer runs local backend
- **WHEN** the developer starts the app with backend env variables
- **THEN** the frontend sends `/api/platform/*` requests to the configured backend and no longer uses local mock providers for authoritative data
