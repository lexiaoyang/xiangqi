## 1. Backend Foundation

- [x] 1.1 Add backend module structure under `server/src` for http, services, repositories, db, integrations, config, and tests
- [x] 1.2 Add environment configuration for backend mode, database URL, Redis URL, JWT/session secrets, CORS, and provider sandbox keys
- [x] 1.3 Add PostgreSQL and Redis local development setup with Docker Compose or documented equivalent
- [x] 1.4 Add database connection pool, Redis client, health checks, request ids, structured errors, and JSON response helpers
- [x] 1.5 Add migration runner and seed runner commands
- [x] 1.6 Keep existing single-file mock server available as sandbox or fixture mode during migration

## 2. Database Schema And Repositories

- [x] 2.1 Create migrations for users, devices, sessions, cloud saves, wallets, ledger entries, SKU catalog, orders, ad show tokens, rewards, event progress, popup records, configs, analytics, audits, consents, and fraud signals
- [x] 2.2 Add unique constraints for idempotency keys, provider identities, active sessions, order ids, reward claims, and ad token consumption
- [x] 2.3 Add repository layer for users/devices/sessions
- [x] 2.4 Add repository layer for cloud saves and conflict versioning
- [x] 2.5 Add repository layer for wallet balances and append-only ledger transactions
- [x] 2.6 Add repository layer for catalog, orders, ads, rewards, events, popups, configs, analytics, audits, consents, and fraud signals
- [x] 2.7 Add seed data matching current default remote config, catalog, ad placements, rewards, events, popups, and audio config

## 3. Identity, Session, And Cloud Save Services

- [x] 3.1 Implement guest identity bootstrap with persisted user, device, session, wallet, cloud save shell, and audit event
- [x] 3.2 Implement session refresh, logout, device listing, and device revocation
- [x] 3.3 Implement account binding with provider identity hash, duplicate provider handling, and merge-confirmation response
- [x] 3.4 Implement account deletion request with session revocation and commercial module restriction
- [x] 3.5 Implement cloud save download and upload APIs with version checking
- [x] 3.6 Implement cloud save merge strategy for highest unlocked level and highest per-level stars
- [x] 3.7 Add tests for guest resume, refresh expiry, device revoke, binding conflict, deletion restriction, save upload, save conflict, and save merge

## 4. Wallet Ledger Service

- [x] 4.1 Implement server-authoritative wallet read from balance projection
- [x] 4.2 Implement ledger grant transaction with append-only entry, balance projection update, idempotency, and audit reference
- [x] 4.3 Implement ledger spend transaction with insufficient-balance rejection
- [x] 4.4 Implement idempotency conflict detection for reused key with different payload
- [x] 4.5 Implement reconciliation helper comparing balance projection and ledger history
- [x] 4.6 Add tests for duplicate grant, duplicate spend, conflicting idempotency key, insufficient balance, and reconciliation issue

## 5. Payment Order Backend

- [x] 5.1 Implement server catalog API with SKU eligibility and config version
- [x] 5.2 Implement idempotent order creation and payment client action response
- [x] 5.3 Implement receipt/provider callback verification abstraction with sandbox mock adapter
- [x] 5.4 Implement order state transitions: created, payment_started, paid, verification_failed, fulfilled, refunded, cancelled, review_required
- [x] 5.5 Implement fulfillment through wallet ledger with duplicate fulfillment protection
- [x] 5.6 Implement refund/reversal with compensating ledger entries and audit events
- [x] 5.7 Implement restore purchases API
- [x] 5.8 Add tests for order creation, repeated order creation, paid callback, invalid receipt, fulfillment, duplicate fulfillment, refund, and restore

## 6. Ad Reward Backend

- [x] 6.1 Implement ad placement and rewarded offer eligibility from server config and user state
- [x] 6.2 Implement show token issuance with expiry, user binding, placement binding, cooldown, cap, consent, and minor restriction checks
- [x] 6.3 Implement ad completion verification with sandbox provider adapter
- [x] 6.4 Implement ad reward ledger grant with show token consumption and idempotency
- [x] 6.5 Implement pending ad reward retry endpoint
- [x] 6.6 Implement Redis-backed cooldown/session cap plus database-backed daily cap fallback
- [x] 6.7 Add tests for show token eligibility, cooldown block, daily cap block, expired token, duplicate completion, reward grant, and pending retry

## 7. Rewards, Events, Popups, And Config

- [x] 7.1 Implement reward center API returning server-side reward state and claimable count
- [x] 7.2 Implement reward claim through wallet ledger and idempotent reward claims table
- [x] 7.3 Implement event config loading, active schedule filtering, eligibility, progress ingestion, and impossible-progress fraud signals
- [x] 7.4 Implement event task/milestone reward claim through wallet ledger
- [x] 7.5 Implement popup impression and suppression persistence by user, popup, and server day
- [x] 7.6 Implement remote config API with active version and feature kill switches
- [x] 7.7 Add tests for reward claim, duplicate reward claim, event progress, expired event, impossible progress, event reward, popup daily cap, and config fallback

## 8. Observability, Compliance, And Safety

- [x] 8.1 Implement audit event writer for all high-value operations
- [x] 8.2 Implement consent read/update APIs and commercial module gate
- [x] 8.3 Implement minor restriction checks for payment, ads, analytics, rewards, and experiments
- [x] 8.4 Implement rate limiting for identity, payment, ad token, reward claim, event progress, and privacy endpoints
- [x] 8.5 Implement fraud signal recording and query helpers
- [x] 8.6 Implement privacy data export and deletion request APIs
- [x] 8.7 Implement privacy-safe analytics ingest with payload sanitizer
- [x] 8.8 Add tests for consent gate, minor restrictions, rate limits, fraud signals, audit logging, export, deletion, and analytics sanitization

## 9. Frontend Backend Provider Integration

- [x] 9.1 Add `httpPlatformProviders` implementing existing provider interfaces against `/api/platform/*`
- [x] 9.2 Add environment switch between mock providers and backend HTTP providers
- [x] 9.3 Change platform bootstrap to load session, config, wallet, reward center, events, and consent from backend in HTTP mode
- [x] 9.4 Change purchases, ad rewards, reward claims, event progress, popup records, and cloud save sync to use backend APIs in HTTP mode
- [x] 9.5 Keep localStorage as cache and pending retry storage, not authoritative data, in HTTP mode
- [x] 9.6 Add frontend integration tests for backend mode success, backend unavailable, token refresh, cache refresh, and idempotent retry

## 10. Documentation, Migration, And Verification

- [x] 10.1 Update README with real backend architecture, database setup, Redis setup, env vars, migration commands, seed commands, and provider mode switch
- [x] 10.2 Document data ownership: backend authoritative vs frontend cache
- [x] 10.3 Document operational runbooks for backup, restore, config rollback, payment incident, ad reward incident, ledger reconciliation, and privacy deletion
- [x] 10.4 Document local development workflows for mock mode and backend mode
- [x] 10.5 Add end-to-end smoke test covering guest bootstrap, cloud save, wallet grant, ad reward, reward claim, event claim, and purchase fulfillment
- [x] 10.6 Run backend tests, frontend tests, build, and linter diagnostics
