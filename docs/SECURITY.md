# Security Best Practices

## Test Credentials

### Never Hardcode Passwords in Tests

❌ **Bad Practice:**
```typescript
const user = await payload.create({
  collection: 'users',
  data: {
    email: 'test@example.com',
    password: 'test123', // GitGuardian will flag this!
  },
})
```

✅ **Good Practice:**
```typescript
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'fallback-password'

const user = await payload.create({
  collection: 'users',
  data: {
    email: 'test@example.com',
    password: TEST_PASSWORD,
  },
})
```

### Environment Variables for Tests

1. **Local Testing:**
   - Copy `.env.test.example` to `.env.test`
   - Set `TEST_USER_PASSWORD` to a secure value
   - `.env.test` is gitignored and won't be committed

2. **CI/CD (GitHub Actions):**
   - The workflow uses a default password if no secret is set
   - For production CI/CD, set `TEST_USER_PASSWORD` in GitHub Secrets

## API Keys and Secrets

### Never Commit Real API Keys

All sensitive credentials should be:
- Stored in `.env` (gitignored)
- Never hardcoded in source code
- Rotated regularly
- Scoped to minimum required permissions

### Google Service Account

The Google service account credentials are:
- Base64 encoded in `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`
- Scoped to Drive and Docs APIs only
- Shared with specific folders only
- Never committed to the repository

### OpenAI API Key

- Stored in `OPENAI_API_KEY` environment variable
- Never logged or exposed in error messages
- Rate limited on the API side

## GitGuardian Integration

This repository uses GitGuardian to scan for accidentally committed secrets.

If you receive a GitGuardian alert:
1. **Immediately rotate** the exposed credential
2. **Remove** the secret from git history using `git filter-branch` or BFG Repo-Cleaner
3. **Update** the code to use environment variables
4. **Commit** the fix

## Reporting Security Issues

If you discover a security vulnerability, please email:
- **Email:** jaeron.rivera@gmail.com
- **Subject:** [SECURITY] Resume Builder Vulnerability

Do not open a public issue for security vulnerabilities.
