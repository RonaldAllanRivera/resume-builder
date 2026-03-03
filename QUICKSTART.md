# Quick Start Guide

## Daily Development Workflow

### Option 1: Using Make (Recommended - Easy to Remember)

```bash
# See all available commands
make help

# Start development
make dev

# Run tests
make test

# Seed database
make seed

# View logs
make logs
```

### Option 2: Using npm scripts

```bash
# Start development
docker compose up -d

# Run tests
pnpm run test:db:up
pnpm test

# Seed database
docker compose exec app pnpm run seed:resume
```

---

## Common Commands

| Command | What it does |
|---------|-------------|
| `make dev` | Start development server |
| `make test` | Run all tests (auto-starts test DB) |
| `make test-watch` | Run tests in watch mode |
| `make seed` | Reset & seed database |
| `make logs` | View application logs |
| `make clean` | Clean up everything |

---

## Testing Workflow

### Local Testing (Before Committing)

```bash
# Quick test run
make test

# Watch mode for development
make test-watch

# Full test suite (lint + types + tests)
make test-all
```

### Automatic Testing (CI/CD)

Tests run automatically on GitHub when you:
- Push to `main` or `develop` branch
- Create a pull request

**No manual action needed!** ✅

---

## Git Hooks (Automatic Quality Checks)

### Pre-commit Hook
Runs automatically before every commit:
- ✅ ESLint checks
- ✅ TypeScript type checking

If checks fail, the commit is blocked.

### Pre-push Hook (Optional)
Uncomment in `.husky/pre-push` to run full tests before pushing.

---

## Setup (One-time)

### 1. Install Husky (Git Hooks)

```bash
# Install husky
pnpm add -D husky

# Initialize husky
pnpm exec husky init

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

### 2. Verify Setup

```bash
# Test that make commands work
make help

# Test git hooks
git add .
git commit -m "test" --dry-run
```

---

## Best Practice Workflow

### Daily Development
1. `make dev` - Start server
2. Make changes
3. `make test-watch` - Run tests in background
4. Commit (hooks run automatically)
5. Push (CI/CD runs automatically)

### Before Merging PR
1. `make test-all` - Full test suite
2. Check GitHub Actions status
3. Merge when all checks pass ✅

---

## Troubleshooting

### "make: command not found"
Use npm scripts instead:
```bash
pnpm run test:db:up
pnpm test
```

### Tests failing
```bash
# Reset test database
make test-db-down
make test-db-up

# Or manually
docker compose -f docker-compose.test.yml down -v
docker compose -f docker-compose.test.yml up -d
```

### Git hooks not running
```bash
# Reinstall husky
rm -rf .husky
pnpm exec husky init
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

---

## Summary

**You'll never forget to test because:**
1. ✅ **Make commands** - Simple `make test`
2. ✅ **Git hooks** - Auto-run on commit
3. ✅ **GitHub Actions** - Auto-run on push
4. ✅ **Watch mode** - Tests run as you code

**Choose your level:**
- **Minimal**: Just use GitHub Actions (automatic)
- **Standard**: `make test` before commits
- **Paranoid**: Enable pre-push hook for full testing

The system has your back! 🛡️
