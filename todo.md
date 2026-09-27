# We Care — feature and delivery tracker

## Delivery checklist — complete

- [x] Responsive landing page, authenticated app shell, clear sign-in path, and resumable onboarding.
- [x] Logo-based We Care branding: supplied wordmark, raspberry/navy palette, matching browser title, and updated public/app copy.
- [x] Persistent user profile, daily activities, and familiar-person records.
- [x] Calendar, daily agenda, activity CRUD, completion controls, and reminder times.
- [x] Past-day view-only behavior and server-side enforcement for edits, rescheduling, completion, and deletion.
- [x] Local-time date rules and boundary tests.
- [x] Optional fictional sample-data load/reset, scoped to records that are still tagged as demo; user-edited examples are preserved.
- [x] Familiar-person photo capture/file selection, preview/remove, explicit consent acknowledgment, backend signature/size checks, private storage, and owner-scoped signed reads.
- [x] Photo-check demo uses no recognition model, avoids false identity claims, and provides a manual, uncertainty-aware fallback.
- [x] Schedule-only deterministic companion is clearly marked as demo mode; answers use the signed-in user's saved schedule only.
- [x] Shared text-to-speech controls, replay/stop handling, speech-rate preference, optional browser speech input, and graceful unsupported-browser messages.
- [x] Additive speech-to-text controls for onboarding, calendar activities, familiar-person details, and profile preferences; existing typed entry and companion voice-question flow remain available.
- [x] Foreground browser reminders with permission flow, duplicate suppression, and clear warning that this is not an urgent-care channel.
- [x] Help/settings, privacy explanation, caregiver/support-person view, and accessible keyboard-managed dialogs.
- [x] Architecture, local run, environment setup, deployment steps, test results, and known limitations documented in `README.md` and `ENVIRONMENT.md`.
- [x] Verification completed: TypeScript passes; 14/14 Vitest tests pass; production frontend/server build succeeds; desktop and mobile landing/dashboard previews reviewed.
- [x] Source archive created with project code/docs and lockfile; dependencies/build artifacts and all dotenv files excluded.

## Handoff boundaries (informational; do not imply a connected service)

**AI and recognition:** The deterministic companion and manual photo-check fallback are the working demo modes. A generative model and face-recognition provider are not connected. Connecting either would require a provider decision, privacy/consent review, credentials, and additional validation.

**Notifications and accounts:** Reminders work while the app is open; no background push service or delivery worker is configured. Each private care space currently belongs to one signed-in account; caregiver invitations and cross-account sharing are not implemented.

**Data retention and language:** Removing a familiar-person profile removes its database reference and in-app access; the storage adapter does not expose underlying-object deletion. English is currently the only interface and voice language.

**Unverified environment checks:** Automated unit/build tests and preview screenshots passed. The sandbox browser did not retain the app's OAuth session for an end-to-end signed-in test, and physical-device camera, microphone, speech, and notification checks remain necessary before real-world use. Those outcomes are intentionally reported as unverified, not as passing.

**Clinical status:** This is a hackathon demonstration, not a medical device, and it has not undergone clinical, legal, or security certification.
