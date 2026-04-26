## ADDED Requirements

### Requirement: Home Event Popup Queue
The system SHALL show configurable home event popups through a prioritized queue.

#### Scenario: Eligible popup shown on home
- **WHEN** the user enters the home screen and at least one popup is eligible
- **THEN** the system shows the highest-priority popup after the home screen is interactive

#### Scenario: Multiple popups eligible
- **WHEN** multiple popups are eligible at the same time
- **THEN** the system sorts by priority, schedule, and configured business type before choosing one popup to display

### Requirement: Popup Frequency Control
The system SHALL enforce frequency limits for home event popups.

#### Scenario: Daily cap reached
- **WHEN** the user has already seen a popup for its configured daily limit
- **THEN** the system does not show that popup again until the next eligible day or reset window

#### Scenario: Today no longer shown
- **WHEN** the user taps "今日不再提示" on a popup
- **THEN** the system suppresses that popup for the rest of the server day

### Requirement: Popup Content and CTA
The system SHALL render event popups with premium visual hierarchy and clear conversion actions.

#### Scenario: Activity popup content
- **WHEN** an activity popup is displayed
- **THEN** the system shows title, subtitle, premium visual, reward preview, countdown if relevant, close control, and primary CTA

#### Scenario: Popup CTA opens activity
- **WHEN** the user taps a popup CTA targeting an activity
- **THEN** the system closes the popup and navigates to the corresponding activity detail or activity center

#### Scenario: Popup CTA starts rewarded ad
- **WHEN** the user taps a popup CTA targeting a rewarded ad offer
- **THEN** the system shows the ad reward preview and starts the configured rewarded ad flow only after user confirmation

### Requirement: Popup Safe Degradation
The system SHALL avoid blocking gameplay when popup config or services are unavailable.

#### Scenario: Popup config invalid
- **WHEN** popup configuration is invalid or missing required assets
- **THEN** the system skips that popup, logs a normalized config error, and leaves the home screen usable

#### Scenario: User closes popup
- **WHEN** the user closes the popup without interacting with the CTA
- **THEN** the system returns focus to the home screen and records the close event

### Requirement: Popup Analytics
The system SHALL emit analytics for popup exposure, click, close, suppression, and conversion.

#### Scenario: Popup exposed
- **WHEN** a popup becomes visible to the user
- **THEN** the system emits a popup exposure event with popup id, campaign id, priority, config version, and user segment

#### Scenario: Popup suppressed
- **WHEN** a popup is skipped due to frequency cap, kill switch, invalid config, or eligibility
- **THEN** the system emits a suppression event with a normalized reason code

### Requirement: Popup Compliance
The system SHALL clearly label paid, ad-based, and reward-based popup actions.

#### Scenario: Ad popup displayed
- **WHEN** a popup promotes a rewarded ad
- **THEN** the system labels that watching an ad is required and shows the exact reward contents before playback

#### Scenario: Paid popup displayed
- **WHEN** a popup promotes a paid SKU
- **THEN** the system shows price, currency, contents, and a cancel path before invoking payment
