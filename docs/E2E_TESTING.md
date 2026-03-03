# E2E Testing Best Practices

## Dynamic Base URL Configuration

E2E tests use Playwright's `baseURL` configuration for environment-agnostic testing.

### Configuration

In `playwright.config.ts`:

```typescript
use: {
  baseURL: process.env.PLAYWRIGHT_BASE_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
}
```

### Priority Order

1. `PLAYWRIGHT_BASE_URL` - Explicit E2E test URL
2. `NEXT_PUBLIC_SERVER_URL` - Application server URL
3. `http://localhost:3000` - Default fallback

### Writing Tests

Always use **relative paths** instead of hardcoded URLs:

```typescript
// ✅ Good - Uses baseURL
await page.goto('/admin/login')
await page.goto('/admin/collections/projects')

// ❌ Bad - Hardcoded URL
await page.goto('http://localhost:3000/admin/login')
```

### Running Tests

**Local Development:**
```bash
# Uses default localhost:3000
pnpm run test:e2e

# Custom URL
PLAYWRIGHT_BASE_URL=http://localhost:3001 pnpm run test:e2e
```

**Production/Staging:**
```bash
# Test against staging
PLAYWRIGHT_BASE_URL=https://staging.example.com pnpm run test:e2e

# Test against production
PLAYWRIGHT_BASE_URL=https://example.com pnpm run test:e2e
```

**CI/CD:**
```yaml
- name: Run E2E tests
  env:
    NEXT_PUBLIC_SERVER_URL: http://localhost:3000
  run: pnpm run test:e2e
```

### Benefits

- ✅ **Environment agnostic** - Same tests work locally, staging, and production
- ✅ **No code changes** - Switch environments via environment variables
- ✅ **CI/CD friendly** - Easy to configure in GitHub Actions
- ✅ **Port flexibility** - Handle port conflicts without code changes

### Example: Testing Multiple Environments

```bash
# Local development
pnpm run test:e2e

# Docker container
PLAYWRIGHT_BASE_URL=http://localhost:3001 pnpm run test:e2e

# Staging environment
PLAYWRIGHT_BASE_URL=https://staging.myapp.com pnpm run test:e2e

# Production smoke tests
PLAYWRIGHT_BASE_URL=https://myapp.com pnpm run test:e2e
```

## Related Files

- `playwright.config.ts` - Playwright configuration
- `tests/e2e/*.spec.ts` - E2E test files
- `.github/workflows/test.yml` - CI/CD configuration
