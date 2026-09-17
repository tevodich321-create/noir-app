# Ngoc Huyen TTS Android

Android APK wrapper for the Ngoc Huyen TTS mobile UI.

## Build
GitHub Actions builds a debug APK on every push to `main`.

## Backend
Set the TTS backend URL inside the app under `MÁY CHỦ TTS`.
The app expects an HTTPS backend implementing:
- `GET /api/quota?device_id=...`
- `POST /api/tts`
- `GET /api/jobs/{job_id}`
- `/download/...`

The backend must enforce the real 100,000-word per job limit and the accumulated daily +100,000 quota.
