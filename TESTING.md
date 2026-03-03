# Testing Guide

This project uses a comprehensive test suite with **Vitest** for integration tests and **Playwright** for end-to-end tests.

## Quick Start

```bash
# Start test database
pnpm run test:db:up

# Run all tests
pnpm test

# Run only integration tests
pnpm run test:int

# Run only E2E tests
pnpm run test:e2e

# Watch mode for development
pnpm run test:watch

# Stop test database
pnpm run test:db:down
```

## Test Structure

```
tests/
├── integration/              # Vitest integration tests
│   ├── seed.test.ts         # Seed function tests
│   └── access-control.test.ts # Access control tests
└── e2e/                     # Playwright E2E tests
    ├── admin-login.spec.ts  # Login flow tests
    ├── database-manager.spec.ts # Database manager UI tests
    └── generation-flow.spec.ts  # Resume generation tests
```

## Integration Tests (Vitest)

Integration tests verify backend logic, database operations, and API functionality.

### Running Integration Tests

```bash
# Run all integration tests
pnpm run test:int

# Watch mode (auto-rerun on changes)
pnpm run test:watch

# Run specific test file
pnpm exec vitest run tests/integration/seed.test.ts
```

### What's Tested

- ✅ **Seed Functions** - Verify all resume data is seeded correctly
- ✅ **Access Control** - Test admin/editor/user permissions
- ✅ **Database Operations** - CRUD operations on collections
- ✅ **API Endpoints** - Backend route handlers

### Example Integration Test

```typescript
import { describe, it, expect, beforeAll } from 'vitest'
import { getPayload } from 'payload'
import config from '@payload-config'

describe('Seed Tests', () => {
  let payload

  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  it('should seed 25 projects', async () => {
    const projects = await payload.find({
      collection: 'projects',
      limit: 100,
    })
    expect(projects.docs).toHaveLength(25)
  })
})
```

## E2E Tests (Playwright)

End-to-end tests verify complete user workflows in a real browser.

### Running E2E Tests

```bash
# Run all E2E tests
pnpm run test:e2e

# Run in headed mode (see browser)
pnpm exec playwright test --headed

# Run specific test file
pnpm exec playwright test tests/e2e/admin-login.spec.ts

# Debug mode
pnpm exec playwright test --debug
```

### What's Tested

- ✅ **Admin Login** - Authentication flows
- ✅ **Database Manager** - Reset and seed UI
- ✅ **Navigation** - Collection and global access
- ✅ **Forms** - Creating and editing records
- ✅ **Critical Flows** - Complete user journeys

### Example E2E Test

```typescript
import { test, expect } from '@playwright/test'

test('should login as admin', async ({ page }) => {
  await page.goto('http://localhost:3000/admin/login')
  await page.fill('input[name="email"]', 'dev@payloadcms.com')
  await page.fill('input[name="password"]', 'test')
  await page.click('button[type="submit"]')
  
  await expect(page.locator('text=Dashboard')).toBeVisible()
})
```

## Test Database

Tests use an **isolated test database** to avoid affecting development data.

### Setup

```bash
# Start test database (PostgreSQL on port 5433)
pnpm run test:db:up

# Verify it's running
docker compose -f docker-compose.test.yml ps

# Stop test database
pnpm run test:db:down
```

### Configuration

- **Database URL**: `postgresql://postgres:postgres@localhost:5433/payload_test`
- **Port**: 5433 (different from dev database on 5432)
- **Environment**: `.env.test`

## CI/CD Integration

Tests run automatically on every push and pull request via **GitHub Actions**.

### Workflow

The CI pipeline runs:
1. ✅ **Lint** - ESLint checks
2. ✅ **Type Check** - TypeScript validation
3. ✅ **Integration Tests** - Vitest tests
4. ✅ **E2E Tests** - Playwright tests

### View Results

- Check the **Actions** tab in GitHub
- Failed tests will block PR merges
- Playwright reports are uploaded as artifacts

## Writing New Tests

### Integration Test Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getPayload } from 'payload'
import config from '@payload-config'

describe('My Feature', () => {
  let payload

  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should do something', async () => {
    // Your test here
    expect(true).toBe(true)
  })
})
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test'

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login or setup
    await page.goto('http://localhost:3000/admin/login')
    // ... login steps
  })

  test('should do something', async ({ page }) => {
    // Your test here
    await expect(page.locator('text=Something')).toBeVisible()
  })
})
```

## Best Practices

1. **Isolation** - Each test should be independent
2. **Cleanup** - Clean up test data in `afterAll` or `afterEach`
3. **Descriptive Names** - Use clear test descriptions
4. **Fast Tests** - Keep tests fast and focused
5. **No Flakiness** - Use proper waits, avoid timeouts
6. **Test What Matters** - Focus on critical user flows

## Troubleshooting

### Tests Failing Locally

```bash
# Ensure test database is running
pnpm run test:db:up

# Reset test database
pnpm run test:db:down && pnpm run test:db:up

# Check environment variables
cat .env.test
```

### Playwright Issues

```bash
# Reinstall browsers
pnpm exec playwright install

# Update Playwright
pnpm update @playwright/test
```

### Database Connection Errors

```bash
# Check if test database is running
docker compose -f docker-compose.test.yml ps

# View logs
docker compose -f docker-compose.test.yml logs postgres-test
```

## Coverage (Future)

To add test coverage reporting:

```bash
# Install coverage tool
pnpm add -D @vitest/coverage-v8

# Run with coverage
pnpm exec vitest run --coverage
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Payload Testing Guide](https://payloadcms.com/docs/testing)
