## ADDED Requirements

### Requirement: Server Authoritative Wallet
The backend SHALL be the authoritative source for all wallet balances.

#### Scenario: Client requests wallet
- **WHEN** the client requests wallet with a valid session
- **THEN** the backend returns balances projected from server-side ledger data

#### Scenario: Client attempts local asset mutation
- **WHEN** the client modifies local cache without a backend ledger entry
- **THEN** the backend wallet remains unchanged and the next sync restores server-authoritative balances

### Requirement: Append Only Ledger
The backend SHALL record every asset change as an append-only ledger entry.

#### Scenario: Reward grants assets
- **WHEN** a reward, purchase, ad, activity, or manual grant changes assets
- **THEN** the backend writes ledger deltas, balance-after snapshot, source, source id, idempotency key, and audit reference in one transaction

#### Scenario: Asset spend occurs
- **WHEN** stamina, coins, hints, or other assets are spent
- **THEN** the backend writes negative ledger deltas and rejects the transaction if resulting balance would be invalid

### Requirement: Idempotent Asset Mutation
The backend SHALL prevent duplicate grants or spends from repeated requests.

#### Scenario: Same idempotency key retried
- **WHEN** the same user, operation, and idempotency key are submitted again
- **THEN** the backend returns the original wallet result without writing a duplicate ledger entry

#### Scenario: Conflicting idempotency key payload
- **WHEN** the same idempotency key is reused with different payload
- **THEN** the backend rejects the request as an idempotency conflict and writes a fraud or audit signal

### Requirement: Wallet Reconciliation
The backend SHALL support reconciliation between wallet projection and ledger history.

#### Scenario: Reconciliation job runs
- **WHEN** an operational reconciliation job compares balances and ledger projection
- **THEN** the backend reports clean, pending, or issue state without silently changing historical ledger entries
