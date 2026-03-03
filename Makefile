# Resume Builder - Development Commands
# Run 'make help' to see all available commands

.PHONY: help dev test test-watch test-db-up test-db-down test-all clean

help: ## Show this help message
	@echo "Resume Builder - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start development server
	docker compose up -d
	@echo "✅ Dev server starting at http://localhost:3000"

test-db-up: ## Start test database
	docker compose -f docker-compose.test.yml up -d
	@echo "✅ Test database running on port 5433"

test-db-down: ## Stop test database
	docker compose -f docker-compose.test.yml down
	@echo "✅ Test database stopped"

test: test-db-up ## Run all tests (integration + E2E)
	@echo "🧪 Running all tests..."
	pnpm test
	@echo "✅ All tests passed!"

test-watch: test-db-up ## Run tests in watch mode
	@echo "🧪 Running tests in watch mode..."
	pnpm run test:watch

test-int: test-db-up ## Run integration tests only
	@echo "🧪 Running integration tests..."
	pnpm run test:int

test-e2e: test-db-up ## Run E2E tests only
	@echo "🧪 Running E2E tests..."
	pnpm run test:e2e

test-all: test-db-up ## Run tests + lint + type check
	@echo "🧪 Running full test suite..."
	pnpm run lint
	pnpm exec tsc --noEmit
	pnpm test
	@echo "✅ Full test suite passed!"

seed: ## Seed database with resume data
	docker compose exec app pnpm run reset:database
	docker compose exec app pnpm run seed:resume
	@echo "✅ Database seeded!"

reset: ## Reset database
	docker compose exec app pnpm run reset:database
	@echo "✅ Database reset!"

clean: ## Clean up all containers and volumes
	docker compose down -v
	docker compose -f docker-compose.test.yml down -v
	@echo "✅ All containers and volumes removed"

logs: ## View application logs
	docker compose logs -f app

restart: ## Restart development server
	docker compose restart app
	@echo "✅ Server restarted"
