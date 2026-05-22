# ══════════════════════════════════════════════════════════════════════════════
#  HRM NestJS — Makefile
# ══════════════════════════════════════════════════════════════════════════════

.DEFAULT_GOAL := help
.PHONY: help \
        install build start dev debug \
        lint format \
        test test-watch test-cov test-e2e \
        docker-build docker-build-dev \
        docker-up docker-down docker-restart docker-ps docker-logs docker-shell \
        docker-up-dev docker-down-dev docker-restart-dev docker-logs-dev docker-shell-dev \
        docker-prune clean

# ── Variables ─────────────────────────────────────────────────────────────────

APP_NAME   := hrm-nest-js
IMAGE_TAG  ?= latest

DC         := docker compose
DC_DEV     := docker compose -f docker-compose.dev.yml

# ── Help ──────────────────────────────────────────────────────────────────────

help: ## Show this help
	@echo ""
	@echo "  Usage: make <target>"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} \
		/^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}' \
		$(MAKEFILE_LIST)
	@echo ""

# ══════════════════════════════════════════════════════════════════════════════
#  LOCAL DEVELOPMENT
# ══════════════════════════════════════════════════════════════════════════════

install: ## Install npm dependencies
	npm install

build: ## Compile TypeScript → dist/
	npm run build

start: build ## Build then start in production mode (local)
	npm run start:prod

dev: build ## Build then start in watch mode (local)
	npm run start:dev

debug: ## Start in debug + watch mode (local)
	npm run start:debug

# ══════════════════════════════════════════════════════════════════════════════
#  CODE QUALITY
# ══════════════════════════════════════════════════════════════════════════════

lint: ## Run ESLint with auto-fix
	npm run lint

format: ## Run Prettier with auto-format
	npm run format

# ══════════════════════════════════════════════════════════════════════════════
#  TESTING
# ══════════════════════════════════════════════════════════════════════════════

test: ## Run unit tests
	npm run test

test-watch: ## Run unit tests in watch mode
	npm run test:watch

test-cov: ## Run unit tests with coverage report
	npm run test:cov

test-e2e: ## Run end-to-end tests
	npm run test:e2e

# ══════════════════════════════════════════════════════════════════════════════
#  DOCKER — BUILD
# ══════════════════════════════════════════════════════════════════════════════

docker-build: ## Build production image  (target: production)
	docker build \
		--file docker/Dockerfile \
		--target production \
		--tag $(APP_NAME):$(IMAGE_TAG) \
		.

docker-build-dev: ## Build development image  (target: builder)
	docker build \
		--file docker/Dockerfile \
		--target builder \
		--tag $(APP_NAME):dev \
		.

# ══════════════════════════════════════════════════════════════════════════════
#  DOCKER — PRODUCTION (docker-compose.yml)
# ══════════════════════════════════════════════════════════════════════════════

docker-up: ## Start all production containers (detached)
	$(DC) up -d

docker-down: ## Stop and remove production containers
	$(DC) down

docker-restart: ## Restart production containers
	$(DC) restart

docker-ps: ## List running production containers
	$(DC) ps

docker-logs: ## Tail production logs  (Ctrl-C to stop)
	$(DC) logs -f

docker-shell: ## Open shell in production app container
	$(DC) exec app sh

# ══════════════════════════════════════════════════════════════════════════════
#  DOCKER — DEVELOPMENT (docker-compose.dev.yml)
# ══════════════════════════════════════════════════════════════════════════════

docker-dev: ## Build, start dev containers and tail logs (watch mode)
	$(DC_DEV) up -d --build
	$(DC_DEV) logs -f app

docker-up-dev: ## Start all development containers (detached)
	$(DC_DEV) up -d

docker-down-dev: ## Stop and remove development containers
	$(DC_DEV) down

docker-restart-dev: ## Restart development containers
	$(DC_DEV) restart

docker-logs-dev: ## Tail development logs  (Ctrl-C to stop)
	$(DC_DEV) logs -f

docker-shell-dev: ## Open shell in development app container
	$(DC_DEV) exec app sh

# ══════════════════════════════════════════════════════════════════════════════
#  CLEANUP
# ══════════════════════════════════════════════════════════════════════════════

docker-prune: ## Remove stopped containers, unused images & volumes
	docker system prune -f
	docker volume prune -f

clean: ## Remove dist/, coverage/ and node_modules/
	rm -rf dist coverage node_modules
