## 1. Music Generation

- [x] 1.1 Change generated BGM duration to approximately 60 seconds
- [x] 1.2 Redesign BGM to be more pleasant using warmer pads, rounded bass, soft percussion, and a less harsh uplifting hook
- [x] 1.3 Ensure BGM is rendered as one continuous looping `AudioBuffer` instead of recurring short tones
- [x] 1.4 Keep BGM generation cached per audio context and scene
- [x] 1.5 Add a separate one-minute home screen ambience/effects loop buffer
- [x] 1.6 Split home lobby and gameplay BGM into distinct arrangements instead of reusing the same template

## 2. Audio Controls And Separation

- [x] 2.1 Preserve first-user-gesture unlock for the generated music buffer
- [x] 2.2 Preserve music mute, master mute, and volume controls
- [x] 2.3 Keep SFX playback separate from BGM and ensure SFX does not drive background rhythm
- [x] 2.4 Stop and dispose looping BGM safely on scene change, mute, or manager disposal
- [x] 2.5 Start home ambience/effects loop only on the home lobby and stop it on non-home screens

## 3. Verification And Documentation

- [x] 3.1 Add tests or test hooks proving generated BGM duration is about 60 seconds and loop playback is enabled
- [x] 3.2 Add tests proving SFX and BGM state are separated
- [x] 3.3 Update README with the 60-second BGM plus home loop strategy and real asset replacement path
- [x] 3.4 Run `npm test`, `npm run build`, and linter diagnostics
- [x] 3.5 Add tests proving home lobby and gameplay BGM use different arrangements
