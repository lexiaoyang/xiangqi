## ADDED Requirements

### Requirement: Top-Tier Mini-Game Visual Standard
The system SHALL treat first-tier studio mini-game quality as the minimum visual standard for home, activity, ad, shop, reward, and popup surfaces.

#### Scenario: New commercial surface designed
- **WHEN** a new commercial surface is added or redesigned
- **THEN** the surface includes clear hierarchy, premium composition, polished states, high-contrast CTA, visual depth, and mobile-first layout

#### Scenario: Placeholder visual proposed
- **WHEN** an implementation uses a plain white card, raw text list, unstyled button, or engineering placeholder for a user-facing commercial surface
- **THEN** the design is considered incomplete and must be revised before the task is marked done

### Requirement: Home Screen Production Quality
The system SHALL make the home screen feel like a live operated mini-game lobby.

#### Scenario: Home screen renders
- **WHEN** the user opens the home screen
- **THEN** the user can immediately perceive current campaign progress, available rewards, ad offers, activity entry, shop entry, account state, and primary play CTA

#### Scenario: Home screen has liveops content
- **WHEN** active events or ad offers are available
- **THEN** the home screen displays them as polished, high-visibility operational cards rather than hidden secondary text

### Requirement: Commercial CTA Clarity
The system SHALL make paid, ad-based, and reward-based CTAs visually distinct and compliant.

#### Scenario: Ad CTA rendered
- **WHEN** a rewarded ad CTA is visible
- **THEN** it includes an ad label, reward preview, video/ad iconography, and state for available, cooldown, capped, loading, and failed

#### Scenario: Paid CTA rendered
- **WHEN** a paid SKU CTA is visible
- **THEN** it includes price, currency, content preview, purchase confirmation path, unavailable state, and refund/restore context where relevant

#### Scenario: Reward claim CTA rendered
- **WHEN** a reward claim CTA is visible
- **THEN** it includes claimable state, reward contents, already claimed state, locked/progress state, and success feedback

### Requirement: Motion and Audio Polish
The system SHALL use motion and audio feedback to reinforce important actions without hurting accessibility.

#### Scenario: Reward granted
- **WHEN** a reward is granted from ad, event, sign-in, task, shop, or popup conversion
- **THEN** the system provides coordinated visual feedback and sound feedback if enabled

#### Scenario: Reduced motion or muted user
- **WHEN** reduced motion is enabled or audio is muted
- **THEN** the system suppresses non-essential animation/audio and still communicates the result clearly

### Requirement: Empty, Error, Disabled, and Loading States
The system SHALL provide production-quality states for every liveops, ad, audio, shop, and reward surface.

#### Scenario: Data loading
- **WHEN** event, popup, audio, ad, or reward data is loading
- **THEN** the system displays a polished skeleton, shimmer, or loading state appropriate to the surface

#### Scenario: Data unavailable
- **WHEN** event, ad, reward, or shop data is unavailable
- **THEN** the system displays a user-safe error state with retry, fallback, disabled, or offline messaging

### Requirement: Design Review Gate
The system SHALL require a design-quality review before marking user-facing mini-game tasks complete.

#### Scenario: Task touches user-facing UI
- **WHEN** an implementation changes home, activity, shop, reward, popup, ad, audio, or gameplay presentation
- **THEN** the implementer checks the first-tier mini-game standard skill before finalizing

#### Scenario: User reports low quality
- **WHEN** the user reports that UI looks cheap, childish, placeholder-like, or not like a major studio game
- **THEN** the next iteration prioritizes visual hierarchy, art direction, interaction feel, and commercial clarity before adding more backend mechanics
