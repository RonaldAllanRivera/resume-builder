# Changelog

## Unreleased

- Fixed Projects admin create/edit crash caused by the experimental slug UI field requiring `ServerFunctionsProvider`.
- Updated `projects` to use a plain `slug` text field with automatic generation from `title`.

## [0.1.0] - 2026-02-01

- Implemented initial resume/portfolio CMS data model (collections + globals).
- Added minimal RBAC (`admin`, `editor`) to `users`.
- Enforced private-by-default resume contact fields with publish toggles.
- Updated seed endpoint to match new global typings and RBAC.
- Updated `.env.example` to reflect PostgreSQL and include placeholders for Vercel Blob, OpenAI, and Google Docs.
- Completed Google Docs service account setup for Drive exports (shared folder + env vars populated).

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
