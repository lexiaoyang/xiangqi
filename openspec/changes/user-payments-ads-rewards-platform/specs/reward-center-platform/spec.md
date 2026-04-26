## ADDED Requirements

### Requirement: Reward Center Home
The system SHALL provide a reward center that aggregates claimable rewards, tasks, sign-in, achievements, mail, and limited-time events.

#### Scenario: Reward center opens
- **WHEN** the user opens the reward center
- **THEN** the system displays claimable count, active reward categories, timers, and next recommended claim

#### Scenario: Reward center unavailable
- **WHEN** reward configuration cannot be loaded
- **THEN** the system displays cached rewards if available and blocks new claims requiring server confirmation

### Requirement: Daily Sign-In
The system SHALL support daily sign-in rewards with streak tracking and missed-day behavior.

#### Scenario: First daily sign-in
- **WHEN** the user signs in for the current server day
- **THEN** the system grants the configured reward and records the day as claimed

#### Scenario: Duplicate daily sign-in
- **WHEN** the user attempts to sign in again on the same server day
- **THEN** the system returns already claimed without granting another reward

### Requirement: Task System
The system SHALL track daily, weekly, and progression tasks.

#### Scenario: Task progress updated
- **WHEN** the user completes a tracked action such as clearing a level
- **THEN** the system increments matching task progress and marks completed tasks claimable

#### Scenario: Task reset
- **WHEN** the server day or week resets
- **THEN** the system resets configured daily or weekly tasks and preserves progression tasks

### Requirement: Achievement System
The system SHALL unlock one-time achievements based on durable gameplay milestones.

#### Scenario: Achievement unlocked
- **WHEN** the user reaches an achievement condition
- **THEN** the system marks the achievement claimable and emits an unlock notification

#### Scenario: Achievement already claimed
- **WHEN** the user claims an achievement reward that was already claimed
- **THEN** the system returns already claimed and does not grant assets again

### Requirement: Mailbox Rewards
The system SHALL support system mail with optional attachments.

#### Scenario: Mail received
- **WHEN** the user has active mail
- **THEN** the reward center displays unread mail count, subject, expiry, and attachment summary

#### Scenario: Attachment claimed
- **WHEN** the user claims mail attachments
- **THEN** the system grants attachments once and marks the mail attachment claimed

### Requirement: Gift Codes
The system SHALL support redeemable gift codes with validation and redemption limits.

#### Scenario: Valid gift code
- **WHEN** the user enters a valid unused gift code
- **THEN** the system grants configured rewards and records the redemption

#### Scenario: Invalid gift code
- **WHEN** the user enters an expired, disabled, or exhausted gift code
- **THEN** the system rejects redemption with a clear reason

### Requirement: Event Rewards
The system SHALL support limited-time event reward tracks.

#### Scenario: Event active
- **WHEN** a reward event is active for the user segment
- **THEN** the reward center displays event progress, milestones, expiry, and claimable rewards

#### Scenario: Event expired
- **WHEN** an event has expired
- **THEN** the system hides unclaimable milestones and prevents new event progress

### Requirement: Unified Claim Pipeline
The system SHALL use one reward claim pipeline for sign-in, tasks, achievements, mail, events, ads, and purchases.

#### Scenario: Claim succeeds
- **WHEN** a reward claim is valid
- **THEN** the system writes wallet ledger entries, marks the reward claimed, and returns delivered contents

#### Scenario: Claim retried
- **WHEN** the same reward claim request is retried with the same claim id
- **THEN** the system returns the original claim result without duplicate grant

### Requirement: Claim Preview
The system SHALL show reward contents before claim when practical.

#### Scenario: Task reward preview
- **WHEN** a task is visible in the reward center
- **THEN** the UI displays reward type, amount, and claim state

#### Scenario: Mystery reward
- **WHEN** a reward is intentionally randomized
- **THEN** the UI labels it as random and the server records the resolved reward at claim time

### Requirement: Anti-Abuse
The system SHALL protect rewards against duplicate, impossible, and scripted claims.

#### Scenario: Impossible task progress
- **WHEN** submitted task progress exceeds plausible gameplay limits
- **THEN** the system rejects or quarantines the progress event for review

#### Scenario: Excessive claim attempts
- **WHEN** a user repeatedly attempts invalid reward claims
- **THEN** the system rate-limits reward claim endpoints for that user and device

### Requirement: Reward Notifications
The system SHALL surface claimable rewards without blocking gameplay.

#### Scenario: Claimable reward appears
- **WHEN** a reward becomes claimable
- **THEN** the UI increments reward center badge count and may show a non-blocking toast

#### Scenario: User dismisses notification
- **WHEN** the user dismisses a reward notification
- **THEN** the reward remains available in the reward center until claimed or expired
