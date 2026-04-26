# live-event-center Specification

## Purpose
TBD - created by archiving change premium-audio-events-ad-rewards. Update Purpose after archive.
## Requirements
### Requirement: Activity Center Home
The system SHALL provide an activity center that aggregates active events, event tasks, event rewards, event timers, and recommended event actions.

#### Scenario: Activity center opens
- **WHEN** the user taps the activity center entry on the home screen
- **THEN** the system displays active event cards, event status, time remaining, claimable count, and recommended next action

#### Scenario: No active events
- **WHEN** no event is active for the user
- **THEN** the system displays a polished empty state and does not show broken placeholders

### Requirement: Event Configuration
The system SHALL load event definitions from remote configuration with bundled defaults.

#### Scenario: Event config loaded
- **WHEN** the game starts successfully online
- **THEN** the system loads event ids, titles, visual themes, schedules, task rules, reward contents, CTA targets, priority, and eligibility rules

#### Scenario: Event config fallback
- **WHEN** remote event config fails or fails validation
- **THEN** the system uses the last valid cached event config or bundled defaults and records a fallback event

### Requirement: Event Schedule and Eligibility
The system SHALL show events only when the user is eligible and the event is inside its schedule window.

#### Scenario: Event active for user
- **WHEN** server time is within the event schedule and the user matches event eligibility rules
- **THEN** the event appears in the activity center and any configured home entry points

#### Scenario: Event expired
- **WHEN** server time is outside the event schedule
- **THEN** the event is hidden or marked ended according to config, and new event progress is blocked

### Requirement: Event Detail Page
The system SHALL provide an event detail view with premium visual presentation and actionable tasks.

#### Scenario: User opens event detail
- **WHEN** the user selects an event card
- **THEN** the system displays event artwork, title, description, countdown, task list, reward track, and CTA buttons

#### Scenario: Event has ad task
- **WHEN** an event includes a rewarded ad task
- **THEN** the system labels the task as ad-based and shows the reward preview before playback

### Requirement: Event Task Progress
The system SHALL ingest gameplay, ad watch, reward claim, shop visit, purchase, and login actions into event task progress.

#### Scenario: Gameplay event progresses task
- **WHEN** the user clears a level and an active event tracks level clears
- **THEN** the system updates event task progress and marks completed tasks claimable

#### Scenario: Impossible event progress
- **WHEN** submitted progress exceeds plausible limits for the action type
- **THEN** the system rejects or quarantines the progress and records a fraud signal

### Requirement: Event Reward Claim
The system SHALL grant event rewards through the unified wallet ledger and idempotent reward pipeline.

#### Scenario: Event reward claimed
- **WHEN** the user claims a completed event milestone
- **THEN** the system writes wallet ledger entries, marks the milestone claimed, and plays reward feedback

#### Scenario: Duplicate event claim
- **WHEN** the same event reward claim is retried with the same claim id
- **THEN** the system returns the original result without granting duplicate assets

### Requirement: Activity Center Quality Bar
The system SHALL render the activity center to a top-tier mini-game quality standard.

#### Scenario: Event card rendered
- **WHEN** an event card is visible
- **THEN** the card includes clear hierarchy, premium artwork or polished fallback visual, reward preview, timer, and high-contrast CTA

#### Scenario: Reduced motion enabled
- **WHEN** the user has reduced motion enabled
- **THEN** the activity center disables non-essential animations while keeping layout and information hierarchy intact

