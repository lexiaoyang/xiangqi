## ADDED Requirements

### Requirement: Adult-Oriented Copy And Briefing
The UI SHALL use mature strategy language and avoid childish or meaningless labels for level, shop, VIP, and result screens.

#### Scenario: Player views level card
- **WHEN** the level card is displayed
- **THEN** the copy describes the tactical problem, not just “start level”.

### Requirement: Level Prep Experience
Advanced levels SHALL include a preparation layer with objectives, modifiers, recommended tools, resource cost, and expected difficulty.

#### Scenario: Player taps advanced level
- **WHEN** the level has complexity above the beginner band
- **THEN** the player sees a prep brief before entering the board.

### Requirement: Result Screen Strategy Feedback
The result screen SHALL summarize route quality, objective completion, tool usage, mastery label, and recommended improvement.

#### Scenario: Player clears level
- **WHEN** the result screen opens
- **THEN** it shows stars, mastery label, reward breakdown, objective status, and one strategy tip.

### Requirement: Premium Visual Hierarchy
New strategy, shop, and VIP UI SHALL follow the tier-one mini-game standard with clear CTA hierarchy, readable mobile layout, and no placeholder-looking white cards.

#### Scenario: Player opens shop or VIP panel on mobile
- **WHEN** the viewport is mobile-sized
- **THEN** core CTA, reward contents, VIP benefits, and category navigation are readable without horizontal scrolling.

### Requirement: Onboarding For New Mechanics
New mechanics SHALL include lightweight first-time explanations and reusable labels.

#### Scenario: First encounter with sentry
- **WHEN** the player reaches the first level with sentries
- **THEN** the game shows a concise explanation of the sentry rule and its counter tools.
