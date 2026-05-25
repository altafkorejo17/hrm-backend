# ==============================================================================
#  HRM NestJS Backend — Makefile
#  Author : Altaf
#  Purpose: Shorthand commands for local dev, Docker management and testing.
#           Run `make help` to see all available targets.
# ==============================================================================
.DEFAULT_GOAL := help
.PHONY: help install lint format \
        test test-watch test-cov test-e2e \
        up down reset logs shell ps \
        prod-up prod-down prod-logs prod-shell \
        prune clean

DC   := docker compose -f docker-compose.dev.yml
DC_P := docker compose

# ── Help ──────────────────────────────────────────────────────────────────────
help: ## Show available commands
	@echo ""
	@awk 'BEGIN {FS=":.*?## "} /^[a-zA-Z_-]+:.*?## / \
	  {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""

# ── Local ─────────────────────────────────────────────────────────────────────
install: ## Install npm dependencies
	npm install

lint: ## Lint and auto-fix
	npm run lint

format: ## Format with Prettier
	npm run format

# ── Tests ─────────────────────────────────────────────────────────────────────
test: ## Run unit tests
	npm run test

test-watch: ## Run unit tests in watch mode
	npm run test:watch

test-cov: ## Run unit tests with coverage
	npm run test:cov

test-e2e: ## Run end-to-end tests
	npm run test:e2e

# ── Dev (docker-compose.dev.yml) ──────────────────────────────────────────────
up: ## Build and start dev containers
	$(DC) up -d --build

down: ## Stop dev containers
	$(DC) down

reset: ## Wipe dev DB volume and restart fresh  ← fixes corrupt MySQL
	$(DC) down -v
	$(DC) up -d --build

logs: ## Tail dev logs  (Ctrl-C to stop)
	$(DC) logs -f

shell: ## Open shell in dev app container
	$(DC) exec app sh

ps: ## List dev containers
	$(DC) ps

# ── Production (docker-compose.yml) ───────────────────────────────────────────
prod-up: ## Build and start prod containers
	$(DC_P) up -d --build

prod-down: ## Stop prod containers
	$(DC_P) down

prod-logs: ## Tail prod logs  (Ctrl-C to stop)
	$(DC_P) logs -f

prod-shell: ## Open shell in prod app container
	$(DC_P) exec app sh

# ── Cleanup ───────────────────────────────────────────────────────────────────
prune: ## Remove stopped containers, unused images and volumes
	docker system prune -f && docker volume prune -f

clean: ## Remove dist/, coverage/ and node_modules/
	rm -rf dist coverage node_modules
