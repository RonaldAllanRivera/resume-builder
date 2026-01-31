# Changelog

## Unreleased

- TBD

## 2026-01-31

- Reinstalled the Payload Website Template via `create-payload-app`.
- Configured local development to use PostgreSQL via Docker.
- Verified local app is running:
  - Frontend: `http://localhost:3000`
  - Admin: `http://localhost:3000/admin`
- Added environment variable placeholders for:
  - Vercel Blob (`BLOB_READ_WRITE_TOKEN`)
  - OpenAI (`OPENAI_API_KEY`)
  - Google Docs export (`GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`, `GOOGLE_DRIVE_FOLDER_ID`)
