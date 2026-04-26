# upbeat-looping-bgm Specification

## Purpose
TBD - created by archiving change upbeat-30s-loop-bgm. Update Purpose after archive.
## Requirements
### Requirement: One Minute Upbeat Looping BGM
The system SHALL provide a generated background music loop of approximately 60 seconds that is upbeat, pleasant, energetic, and suitable for motivating casual game play.

#### Scenario: BGM is a complete music segment
- **WHEN** the game starts background music after user interaction
- **THEN** the system plays a continuous one-minute music segment with rhythm, harmony, bass, and melodic layers rather than isolated beep tones

#### Scenario: BGM loops continuously
- **WHEN** the generated music segment reaches the end
- **THEN** the system loops playback without requiring a timer to trigger new notes

### Requirement: Upbeat Game Music Character
The system SHALL make the default background music feel cheerful, energetic, and commercially suitable for a casual mobile mini-game.

#### Scenario: Music drives user action
- **WHEN** the user stays on the lobby or enters gameplay
- **THEN** the background music contains a clear but pleasant pulse, bright chord progression, rounded bass, and uplifting hook that encourages continued play

#### Scenario: Music avoids low-quality beep perception
- **WHEN** background music is playing
- **THEN** the system MUST NOT use single-frequency periodic tones, sparse test tones, or short repeated beeps as the primary BGM experience

### Requirement: Home Screen Audio Loop
The system SHALL provide a separate one-minute home screen audio effects loop layered under the lobby background music.

#### Scenario: User stays on home screen
- **WHEN** the user is on the home screen after audio is unlocked
- **THEN** the system plays a low-volume one-minute looping home ambience/effects layer in addition to the main BGM

#### Scenario: User leaves home screen
- **WHEN** the user navigates from the home screen to gameplay, shop, activity, rewards, or settings
- **THEN** the system stops the home audio effects loop while preserving the correct main BGM context

### Requirement: Distinct Home And Gameplay Music
The system SHALL use different music arrangements for the home lobby and gameplay contexts.

#### Scenario: Home lobby music plays
- **WHEN** the user is on the home screen
- **THEN** the main BGM uses a lighter home-lobby arrangement with softer percussion, warmer pad, and welcoming bell or pluck accents

#### Scenario: Gameplay music plays
- **WHEN** the user starts a level
- **THEN** the main BGM switches to a gameplay arrangement with stronger rhythmic drive, faster tempo, and more forward bass/pulse than the home lobby music

### Requirement: BGM And SFX Separation
The system SHALL keep continuous background music separate from short interaction sound effects.

#### Scenario: Background music plays
- **WHEN** BGM is active
- **THEN** it is played from a looping audio buffer and does not schedule recurring short SFX-like tones

#### Scenario: User taps or claims reward
- **WHEN** the user performs a button tap, reward claim, purchase success, popup open, ad complete, or failure action
- **THEN** the system plays SFX through the SFX path without changing the BGM loop structure

### Requirement: Audio Controls Preserve Music Playback
The system SHALL preserve existing audio controls for the new BGM implementation.

#### Scenario: User mutes music
- **WHEN** the user disables music or master audio
- **THEN** the system stops the looping BGM buffer and suppresses new BGM playback

#### Scenario: User changes volume
- **WHEN** the user changes audio volume
- **THEN** the system adjusts BGM gain without regenerating or restarting the music unnecessarily

### Requirement: Real Asset Replacement Path
The system SHALL keep a clear path for replacing generated fallback music with real authorized audio assets.

#### Scenario: Future authorized music is configured
- **WHEN** a future implementation provides a real audio track for the configured BGM id
- **THEN** the system can replace the generated fallback without changing player-facing audio controls or commercial flows

