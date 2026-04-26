## 1. Backend Foundation

- [ ] 1.1 Add backend module structure under `server/src` for http, services, repositories, db, integrations, config, and tests
- [ ] 1.2 Add environment configuration for backend mode, database URL, Redis URL, JWT/session secrets, CORS, and provider sandbox keys
- [ ] 1.3 Add PostgreSQL and Redis local development setup with Docker Compose or documented equivalent
- [ ] 1.4 Add database connection pool, Redis client, health checks, request ids, structured errors, and JSON response helpers
- [ ] 1.5 Add migration runner and seed runner commands
- [ ] 1.6 Keep existing single-file mock server available as sandbox or fixture mode during migration

## 2. Database Schema And Repositories

- [ ] 2.1 Create migrations for users, devices, sessions, cloud saves, wallets, ledger entries, SKU catalog, orders, ad show tokens, rewards, event progress, popup records, configs, analytics, audits, consents, and fraud signals
- [ ] 2.2 Add unique constraints for idempotency keys, provider identities, active sessions, order ids, reward claims, and ad token consumption
- [ ] 2.3 Add repository layer for users/devices/sessions
- [ ] 2.4 Add repository layer for cloud saves and conflict versioning
- [ ] 2.5 Add repository layer for wallet balances and append-only ledger transactions
- [ ] 2.6 Add repository layer for catalog, orders, ads, rewards, events, popups, configs, analytics, audits, consents, and fraud signals
- [ ] 2.7 Add seed data matching current default remote config, catalog, ad placements, rewards, events, popups, and audio config

## 3. Identity, Session, And Cloud Save Services

- [ ] 3.1 Implement guest identity bootstrap with persisted user, device, session, wallet, cloud save shell, and audit event
- [ ] 3.2 Implement session refresh, logout, device listing, and device revocation
- [ ] 3.3 Implement account binding with provider identity hash, duplicate provider handling, and merge-confirmation response
- [ ] 3.4 Implement account deletion request with session revocation and commercial module restriction
- [ ] 3.5 Implement cloud save download and upload APIs with version checking
- [ ] 3.6 Implement cloud save merge strategy for highest unlocked level and highest per-level stars
- [ ] 3.7 Add tests for guest resume, refresh expiry, device revoke, binding conflict, deletion restriction, save upload, save conflict, and save merge

## 4. Wallet Ledger Service

- [ ] 4.1 Implement server-authoritative wallet read from balance projection
- [ ] 4.2 Implement ledger grant transaction with append-only entry, balance projection update, idempotency, and audit reference
- [ ] 4.3 Implement ledger spend transaction with insufficient-balance rejection
- [ ] 4.4 Implement idempotency conflict detection for reused key with different payload
- [ ] 4.5 Implement reconciliation helper comparing balance projection and ledger history
- [ ] 4.6 Add tests for duplicate grant, duplicate spend, conflicting idempotency key, insufficient balance, and reconciliation issue

## 5. Payment Order Backend

- [ ] 5.1 Implement server catalog API with SKU eligibility and config version
- [ ] 5.2 Implement idempotent order creation and payment client action response
- [ ] 5.3 Implement receipt/provider callback verification abstraction with sandbox mock adapter
- [ ] 5.4 Implement order state transitions: created, payment_started, paid, verification_failed, fulfilled, refunded, cancelled, review_required
- [ ] 5.5 Implement fulfillment through wallet ledger with duplicate fulfillment protection
- [ ] 5.6 Implement refund/reversal with compensating ledger entries and audit events
- [ ] 5.7 Implement restore purchases API
- [ ] 5.8 Add tests for order creation, repeated order creation, paid callback, invalid receipt, fulfillment, duplicate fulfillment, refund, and restore

## 6. Ad Reward Backend

- [ ] 6.1 Implement ad placement and rewarded offer eligibility from server config and user state
- [ ] 6.2 Implement show token issuance with expiry, user binding, placement binding, cooldown, cap, consent, and minor restriction checks
- [ ] 6.3 Implement ad completion verification with sandbox provider adapter
- [ ] 6.4 Implement ad reward ledger grant with show token consumption and idempotency
- [ ] 6.5 Implement pending ad reward retry endpoint
- [ ] 6.6 Implement Redis-backed cooldown/session cap plus database-backed daily cap fallback
- [ ] 6.7 Add tests for show token eligibility, cooldown block, daily cap block, expired token, duplicate completion, reward grant, and pending retry

## 7. Rewards, Events, Popups, And Config

- [ ] 7.1 Implement reward center API returning server-side reward state and claimable count
- [ ] 7.2 Implement reward claim through wallet ledger and idempotent reward claims table
- [ ] 7.3 Implement event config loading, active schedule filtering, eligibility, progress ingestion, and impossible-progress fraud signals
- [ ] 7.4 Implement event task/milestone reward claim through wallet ledger
- [ ] 7.5 Implement popup impression and suppression persistence by user, popup, and server day
- [ ] 7.6 Implement remote config API with active version and feature kill switches
- [ ] 7.7 Add tests for reward claim, duplicate reward claim, event progress, expired event, impossible progress, event reward, popup daily cap, and config fallback

## 8. Observability, Compliance, And Safety

- [ ] 8.1 Implement audit event writer for all high-value operations
- [ ] 8.2 Implement consent read/update APIs and commercial module gate
- [ ] 8.3 Implement minor restriction checks for payment, ads, analytics, rewards, and experiments
- [ ] 8.4 Implement rate limiting for identity, payment, ad token, reward claim, event progress, and privacy endpoints
- [ ] 8.5 Implement fraud signal recording and query helpers
- [ ] 8.6 Implement privacy data export and deletion request APIs
- [ ] 8.7 Implement privacy-safe analytics ingest with payload sanitizer
- [ ] 8.8 Add tests for consent gate, minor restrictions, rate limits, fraud signals, audit logging, export, deletion, and analytics sanitization

## 9. Frontend Backend Provider Integration

- [ ] 9.1 Add `httpPlatformProviders` implementing existing provider interfaces against `/api/platform/*`
- [ ] 9.2 Add environment switch between mock providers and backend HTTP providers
- [ ] 9.3 Change platform bootstrap to load session, config, wallet, reward center, events, and consent from backend in HTTP mode
- [ ] 9.4 Change purchases, ad rewards, reward claims, event progress, popup records, and cloud save sync to use backend APIs in HTTP mode
- [ ] 9.5 Keep localStorage as cache and pending retry storage, not authoritative data, in HTTP mode
- [ ] 9.6 Add frontend integration tests for backend mode success, backend unavailable, token refresh, cache refresh, and idempotent retry

## 10. Documentation, Migration, And Verification

- [ ] 10.1 Update README with real backend architecture, database setup, Redis setup, env vars, migration commands, seed commands, and provider mode switch
- [ ] 10.2 Document data ownership: backend authoritative vs frontend cache
- [ ] 10.3 Document operational runbooks for backup, restore, config rollback, payment incident, ad reward incident, ledger reconciliation, and privacy deletion
- [ ] 10.4 Document local development workflows for mock mode and backend mode
- [ ] 10.5 Add end-to-end smoke test covering guest bootstrap, cloud save, wallet grant, ad reward, reward claim, event claim, and purchase fulfillment
- [ ] 10.6 Run backend tests, frontend tests, build, and linter diagnostics
