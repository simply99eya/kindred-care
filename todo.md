# Kindred Care — feature and bug tracker

## Completed for the demo

- [x] Responsive landing page, authenticated app shell, clear sign-in path, and resumable onboarding.
- [x] Persistent user profile, daily activities, and familiar-person records.
- [x] Calendar, daily agenda, activity CRUD, completion controls, and reminder times.
- [x] Past-day view-only behavior and server-side enforcement for edits, rescheduling, completion, and deletion.
- [x] Local-time date rules with boundary tests.
- [x] Optional sample-data load/reset, scoped to records still tagged fictional; user-edited samples are preserved.
- [x] Familiar-person photo upload/camera selection, preview/remove, server-checked consent, MIME/signature/size validation, private storage, and user-scoped signed access.
- [x] Photo-check demo that does not claim automated identification and gives a manual uncertain-result path.
- [x] Clearly labeled schedule-only deterministic companion, text-to-speech playback controls, and optional browser voice input.
- [x] Help/settings, speech-rate preference, browser permission request, foreground-only reminders, and error states.
- [x] Architecture, local-run, configuration and deployment notes in `README.md` and `ENVIRONMENT.md`.
- [x] Unit tests for calendar/business rules, demo schedule answers, photo file signatures, photo consent, and logout.

## Known follow-ups (not represented as connected features)

- [ ] Configure and validate a real server-side generative AI provider before describing the companion as connected AI.
- [ ] Select a privacy-reviewed, consented recognition provider/model; validate uncertainty handling before enabling identity claims.
- [ ] Add background push notifications only with an appropriate service, delivery monitoring, opt-in and duplicate-scheduling guarantees.
- [ ] Add caregiver invitations and cross-account sharing with explicit access revocation; current care spaces are single-account.
- [ ] Configure object deletion/lifecycle for orphaned private photo objects; the available storage helper exposes upload and signed reads only.
- [ ] Add additional languages and localized voice options if needed.
- [ ] Run end-to-end workflows after signing into the deployed OAuth application; this sandbox browser session did not retain the app login.
- [ ] Test camera, microphone, notifications, and speech across the intended physical devices and browsers.

## Bug status

- No known TypeScript errors or failing automated tests at final validation.
- No unresolved functional bug reported by the preview health check.
- Device-, OAuth-, and third-party-service-dependent checks remain as listed above; those are unverified integration checks rather than claimed passes.
