# ad-monetization-platform Specification

## Purpose
TBD - created by archiving change user-payments-ads-rewards-platform. Update Purpose after archive.
## Requirements
### Requirement: Ad Placement Registry
The system SHALL define all ad placements in a remote-configurable registry.

#### Scenario: Placement loaded
- **WHEN** the client requests ad configuration
- **THEN** the system returns placement ids, formats, enabled flags, rewards, frequency caps, cooldowns, and eligibility rules

#### Scenario: Placement disabled
- **WHEN** a placement is disabled remotely
- **THEN** the client hides or disables the related ad entry point

### Requirement: Rewarded Video Eligibility
The system SHALL evaluate whether a user can watch a rewarded video before loading the ad.

#### Scenario: Eligible rewarded video
- **WHEN** the user has not exceeded placement caps and the placement is enabled
- **THEN** the system allows the client to request a rewarded ad

#### Scenario: Cooldown active
- **WHEN** the placement cooldown has not elapsed
- **THEN** the system blocks the ad request and returns the remaining cooldown

### Requirement: Ad Show Token
The system SHALL issue a signed show token before reward-bearing ads are displayed.

#### Scenario: Token issued
- **WHEN** a rewarded ad is about to be shown
- **THEN** the system issues a token containing user id, placement id, reward id, expiry, and nonce

#### Scenario: Token expired
- **WHEN** the client submits completion with an expired token
- **THEN** the system rejects the reward claim

### Requirement: Rewarded Ad Completion
The system SHALL grant rewarded ad rewards only after verified completion.

#### Scenario: Completion accepted
- **WHEN** the ad provider reports completion for a valid show token
- **THEN** the system writes the reward ledger entry and marks the show token consumed

#### Scenario: Duplicate completion
- **WHEN** the same show token completion is submitted again
- **THEN** the system returns the original reward result without duplicate grant

### Requirement: Ad Provider Adapter
The system SHALL normalize ad SDK behavior through an ad provider adapter.

#### Scenario: Load success
- **WHEN** the provider loads an ad successfully
- **THEN** the adapter reports a normalized loaded state for the placement

#### Scenario: Load failure
- **WHEN** the provider fails to load an ad
- **THEN** the adapter reports a normalized error code and the client displays a non-blocking fallback

### Requirement: Interstitial Ads
The system SHALL support interstitial placements with frequency caps and user experience safeguards.

#### Scenario: Interstitial after level
- **WHEN** a level ends and the interstitial placement is eligible
- **THEN** the system may show an interstitial after the result CTA is visible or dismissed

#### Scenario: No interstitial during play
- **WHEN** the user is actively controlling a maze level
- **THEN** the system MUST NOT show an interstitial ad

### Requirement: Banner and Native Ads
The system SHALL support non-reward ad placements without blocking core gameplay.

#### Scenario: Banner eligible
- **WHEN** a banner placement is enabled for the current screen
- **THEN** the client reserves a layout-safe ad container and loads the banner asynchronously

#### Scenario: Banner fails
- **WHEN** the banner provider fails to fill
- **THEN** the client collapses or replaces the ad container according to placement config

### Requirement: Frequency Capping
The system SHALL enforce user-level, device-level, and placement-level ad frequency caps.

#### Scenario: Daily cap reached
- **WHEN** a user reaches the daily rewarded video cap
- **THEN** the system disables further rewarded claims for that placement until reset

#### Scenario: Session cap reached
- **WHEN** a user reaches the session interstitial cap
- **THEN** the system suppresses interstitials for the remainder of the session

### Requirement: Ad Reward Fallback
The system SHALL handle ad provider uncertainty without granting unverified rewards.

#### Scenario: Provider callback missing
- **WHEN** the ad closes without a verified completion callback
- **THEN** the system does not grant the reward and shows a retry-safe message

#### Scenario: Client network fails after completion
- **WHEN** the ad completes but reward claim submission fails due to network
- **THEN** the client stores the pending show token and retries until expiry

### Requirement: Ad Disclosure
The system SHALL clearly label ad-based rewards and paid alternatives.

#### Scenario: Rewarded ad button shown
- **WHEN** the client displays a rewarded video entry point
- **THEN** the UI labels it as an ad and shows the reward contents before playback

#### Scenario: User declines ad
- **WHEN** the user cancels before ad playback starts
- **THEN** the system does not consume caps or show tokens

### Requirement: Ad Analytics
The system SHALL emit ad funnel events for availability, load, show, complete, close, reward, and failure.

#### Scenario: Rewarded funnel complete
- **WHEN** a rewarded ad loads, shows, completes, and grants reward
- **THEN** the system emits correlated events with placement id, provider, show id, and reward id

#### Scenario: Provider error logged
- **WHEN** an ad provider returns an error
- **THEN** the system records the normalized error without exposing sensitive provider payloads to analytics

