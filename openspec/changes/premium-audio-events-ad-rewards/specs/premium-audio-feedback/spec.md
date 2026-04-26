## ADDED Requirements

### Requirement: Background Music Playback
The system SHALL provide configurable background music for lobby, activity center, shop, reward center, and gameplay contexts.

#### Scenario: Music starts after user interaction
- **WHEN** the user first taps an interactive control after opening the game
- **THEN** the system starts the configured background music for the current screen if music is enabled

#### Scenario: Browser blocks autoplay
- **WHEN** the browser blocks audio playback before user interaction
- **THEN** the system keeps gameplay usable and retries playback after the next user gesture

#### Scenario: Screen changes music context
- **WHEN** the user navigates from the lobby to activity center, shop, reward center, or gameplay
- **THEN** the system switches to the configured music track or ambience for that context without overlapping tracks

### Requirement: UI Sound Effects
The system SHALL play short sound effects for high-value user actions and feedback states.

#### Scenario: Button tap sound
- **WHEN** the user taps a primary lobby, activity, shop, reward, or ad CTA
- **THEN** the system plays the configured tap sound if sound effects are enabled

#### Scenario: Reward claim sound
- **WHEN** coins, stamina, hints, or event rewards are successfully granted
- **THEN** the system plays a reward claim sound and does not play duplicate sounds for retried idempotent grants

#### Scenario: Failure feedback sound
- **WHEN** an action fails due to cooldown, cap, insufficient resource, unavailable ad, or disabled event
- **THEN** the system plays a short failure feedback sound if sound effects are enabled

### Requirement: Audio Settings
The system SHALL allow the user to control music, sound effects, and master volume.

#### Scenario: User mutes all audio
- **WHEN** the user disables audio in settings
- **THEN** the system stops current music, suppresses sound effects, and persists the muted state locally

#### Scenario: Returning user restores audio preferences
- **WHEN** the user reopens the game after changing audio settings
- **THEN** the system restores music enabled state, sound effects enabled state, and volume from local cache

### Requirement: Audio Remote Configuration
The system SHALL load audio track ids, default volume, enabled flags, and kill switches from configuration.

#### Scenario: Audio disabled remotely
- **WHEN** remote config disables audio
- **THEN** the system hides or disables audio controls that would start playback and keeps the game silent

#### Scenario: Audio config unavailable
- **WHEN** audio config cannot be loaded
- **THEN** the system uses bundled defaults and records a config fallback event

### Requirement: Audio Analytics
The system SHALL emit privacy-safe analytics events for audio state changes.

#### Scenario: Audio preference changed
- **WHEN** the user toggles music, sound effects, or master mute
- **THEN** the system emits an audio settings event with the new state and config version

#### Scenario: Audio playback fails
- **WHEN** music or sound effect playback fails
- **THEN** the system emits a normalized audio error event without exposing raw browser internals
