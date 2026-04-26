## 1. Platform Foundations

- [x] 1.1 Define shared domain types for user, wallet, ledger entry, SKU, order, ad placement, reward source, config version, consent, and audit event
- [x] 1.2 Create client API layer with typed request/response contracts and normalized error codes
- [x] 1.3 Create provider interfaces for auth, payment, ads, analytics, and remote config
- [x] 1.4 Implement mock providers for local development and automated tests
- [x] 1.5 Add local cache namespaces for user, wallet, config, reward center, and sync state
- [x] 1.6 Add global commercial feature flags and kill-switch handling

## 2. User Account Platform

- [x] 2.1 Create guest identity bootstrap on first launch
- [x] 2.2 Restore cached guest or bound user session on returning launch
- [x] 2.3 Implement login/binding UI entry points and account state display
- [x] 2.4 Implement session refresh, logout, expired-session fallback, and offline-safe mode
- [x] 2.5 Implement cloud save upload/download API contracts
- [x] 2.6 Implement local/cloud progress merge for unlocked levels and best stars
- [x] 2.7 Add wallet summary query and cached wallet display
- [x] 2.8 Add device association and revocation API contracts
- [x] 2.9 Add account recovery states and guest-loss messaging
- [x] 2.10 Add account deletion request flow and commercial action blocking after deletion
- [x] 2.11 Add account lifecycle audit events

## 3. Asset Ledger And Wallet

- [x] 3.1 Implement append-only ledger model and wallet snapshot projection in mock service
- [x] 3.2 Replace direct coin/stamina mutations in campaign flows with wallet ledger operations where commercial actions are involved
- [x] 3.3 Add idempotency key handling for all wallet mutations
- [x] 3.4 Add reconciliation state to wallet responses
- [x] 3.5 Add wallet UI states for online, cached, syncing, failed, and restricted modes
- [x] 3.6 Add tests for duplicate ledger mutation, balance projection, and offline cache display

## 4. Payment Commerce Platform

- [x] 4.1 Define versioned SKU catalog schema with contents, prices, limits, eligibility, labels, and channel metadata
- [x] 4.2 Replace shop mock SKU cards with catalog-driven rendering
- [x] 4.3 Implement SKU eligibility evaluation and unavailable states
- [x] 4.4 Implement purchase confirmation dialog with contents, price, currency, provider, and cancel action
- [x] 4.5 Implement order creation with idempotency key and order status model
- [x] 4.6 Implement mock payment provider adapter and normalized client actions
- [x] 4.7 Implement receipt/notification verification contract in mock service
- [x] 4.8 Implement idempotent fulfillment into wallet ledger
- [x] 4.9 Implement pending order recovery on app start
- [x] 4.10 Implement restore purchases flow
- [x] 4.11 Implement refund/chargeback reversal handling in mock service
- [x] 4.12 Implement reconciliation issue model and admin-facing data contract
- [x] 4.13 Add payment risk controls for rapid failures and suspicious refunds
- [x] 4.14 Add unit/integration tests for duplicate order, duplicate callback, invalid receipt, refund, and restore purchases

## 5. Ad Monetization Platform

- [x] 5.1 Define ad placement registry schema for rewarded video, interstitial, banner, and native placements
- [x] 5.2 Implement ad placement remote config loading and disabled-entry handling
- [x] 5.3 Implement rewarded video eligibility, cooldown, and cap checks
- [x] 5.4 Implement signed show token creation and expiration in mock service
- [x] 5.5 Implement mock ad provider adapter for load, show, complete, close, and fail states
- [x] 5.6 Implement rewarded ad completion claim and idempotent reward grant
- [x] 5.7 Add retry handling for completed ads whose reward claim failed due to network
- [x] 5.8 Add interstitial placement after result flow without interrupting active gameplay
- [x] 5.9 Add banner/native placement containers with layout-safe collapse on no fill
- [x] 5.10 Add ad disclosure labels and pre-watch reward preview
- [x] 5.11 Emit ad funnel analytics events with placement id, provider, show id, and reward id
- [x] 5.12 Add tests for cooldown, cap reached, duplicate completion, expired token, provider failure, and pending reward retry

## 6. Reward Center Platform

- [x] 6.1 Add reward center route/screen and hub badge entry
- [x] 6.2 Define reward source schemas for sign-in, daily tasks, weekly tasks, progression tasks, achievements, mail, gift codes, and events
- [x] 6.3 Implement daily sign-in streak and server-day claim state
- [x] 6.4 Implement task progress ingestion for level clear, stars earned, tool use, ad watch, and purchase events
- [x] 6.5 Implement achievement unlock and one-time claim logic
- [x] 6.6 Implement mailbox list, unread count, expiry, and attachment claim flow
- [x] 6.7 Implement gift code redemption validation and redemption limits
- [x] 6.8 Implement limited-time event reward tracks and milestone claims
- [x] 6.9 Implement unified claim pipeline backed by wallet ledger
- [x] 6.10 Add reward preview and claim result animation
- [x] 6.11 Add claimable badge/toast notifications that do not block gameplay
- [x] 6.12 Add anti-abuse validation for impossible progress and excessive claim attempts
- [x] 6.13 Add tests for duplicate claim, expired mail, duplicate sign-in, task reset, gift code exhaustion, and event expiry

## 7. LiveOps And Analytics

- [x] 7.1 Define remote config schema and bundled default config
- [x] 7.2 Add config schema validation, cache, fallback, and version reporting
- [x] 7.3 Implement feature flags for account, payments, ads, rewards, and experiments
- [x] 7.4 Implement deterministic A/B experiment assignment and persisted variants
- [x] 7.5 Implement segmentation rules for channel, version, region, progress, payer status, and user lifecycle
- [x] 7.6 Implement scheduled campaign/event config and server-time handling
- [x] 7.7 Define analytics event schema for gameplay, economy, payment, ads, rewards, account, config, and errors
- [x] 7.8 Emit level completion events with monetization config version and tool usage
- [x] 7.9 Emit economy source/sink events from ledger mutations
- [x] 7.10 Emit purchase, ad, reward, account, and config funnel events
- [x] 7.11 Add normalized error reporting for provider and claim failures
- [x] 7.12 Add tests for config fallback, kill switch, experiment stability, segment validation, and privacy-safe analytics payloads

## 8. Compliance And Safety

- [x] 8.1 Add consent state model with privacy terms version, optional analytics consent, ads personalization consent, and locale
- [x] 8.2 Gate non-essential SDK initialization behind consent
- [x] 8.3 Add consent accept/revoke UI and persistence
- [x] 8.4 Add age declaration/minor-safe commercial restrictions
- [x] 8.5 Enforce payment confirmation requirements for all paid SKUs
- [x] 8.6 Enforce ad labeling and reward disclosure for all ad entry points
- [x] 8.7 Add data minimization checks for analytics and stored payment metadata
- [x] 8.8 Add audit logs for order state changes, account binding, manual grants, and consent changes
- [x] 8.9 Add fraud signal collection for suspicious ad claims, wallet anomalies, refunds, and impossible rewards
- [x] 8.10 Add rate limiting for login, reward claim, order creation, and ad reward endpoints
- [x] 8.11 Add data export and deletion request API contracts
- [x] 8.12 Add safe degradation when compliance state or commercial services are unavailable
- [x] 8.13 Add tests for consent gating, minor restrictions, commercial kill switch, audit logging, and rate limiting

## 9. UI Integration

- [x] 9.1 Add account panel to hub with guest/bound/sync/restricted states
- [x] 9.2 Upgrade shop screen to show catalog-driven paid, ad-supported, and reward-linked products
- [x] 9.3 Add rewarded ad CTA patterns for stamina, hints, coins, and revive/retry offers
- [x] 9.4 Add reward center screen with tabs for sign-in, tasks, achievements, mail, gift codes, and events
- [x] 9.5 Add wallet/resource bar sync indicators and claim animations
- [x] 9.6 Add purchase pending, success, failure, refund, and restore UI states
- [x] 9.7 Add commercial error empty states with retry, offline, disabled, restricted, and unavailable variants
- [x] 9.8 Ensure all new UI respects mobile safe areas, reduced motion, and accessibility labels

## 10. Server Mock And API Surface

- [x] 10.1 Add mock server routes for identity, session, cloud save, wallet, ledger, and device management
- [x] 10.2 Add mock server routes for catalog, order, receipt verification, fulfillment, refund, restore, and reconciliation
- [x] 10.3 Add mock server routes for ad config, show token, completion claim, and frequency caps
- [x] 10.4 Add mock server routes for reward center, sign-in, tasks, achievements, mail, gift codes, and events
- [x] 10.5 Add mock server routes for remote config, experiments, analytics ingestion, consent, audit, and safety checks
- [x] 10.6 Add JSON schema or TypeScript contract tests for all API payloads
- [x] 10.7 Add persistence strategy for local development mock data without leaking secrets

## 11. Testing And Verification

- [x] 11.1 Add unit tests for all domain reducers/selectors and provider adapters
- [x] 11.2 Add integration tests for guest-to-bound migration and cloud progress merge
- [x] 11.3 Add integration tests for paid order lifecycle from catalog to fulfillment
- [x] 11.4 Add integration tests for rewarded ad lifecycle from eligibility to reward grant
- [x] 11.5 Add integration tests for reward center claim flows and duplicate prevention
- [x] 11.6 Add tests for offline startup, config fallback, and kill switches
- [x] 11.7 Add E2E smoke flow: guest plays level, claims sign-in reward, watches rewarded ad, opens shop, starts mock purchase, binds account, syncs progress
- [x] 11.8 Add regression tests ensuring 1000 campaign levels remain solvable after config/feature changes

## 12. Documentation And Rollout

- [x] 12.1 Update README with account, payment, ads, reward center, remote config, and mock server development instructions
- [x] 12.2 Document local environment variables and provider mock/sandbox modes
- [x] 12.3 Document API contracts, idempotency keys, ledger event types, and analytics event names
- [x] 12.4 Document operational runbooks for disabling payments, disabling ads, rolling back config, and recovering pending orders
- [x] 12.5 Document compliance checklist for privacy, minors, ads, purchases, deletion, and data export
- [x] 12.6 Prepare phased rollout plan: internal mock, sandbox QA, gray release, commercial launch, post-launch monitoring
