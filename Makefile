# Convenience wrappers around docker compose. All targets are idempotent.

.PHONY: help up down logs ps build rebuild reset shell-backend shell-ai shell-frontend

help:
	@echo "AttendAI stack targets:"
	@echo "  make up              Start everything in the background"
	@echo "  make down            Stop everything (volumes preserved)"
	@echo "  make logs            Tail logs from every service"
	@echo "  make ps              Show running containers and health"
	@echo "  make build           Build images without starting"
	@echo "  make rebuild         Force a clean rebuild + restart"
	@echo "  make reset           Stop + delete all data (DESTRUCTIVE)"
	@echo "  make shell-backend   Open a shell in the backend container"
	@echo "  make shell-ai        Open a shell in the AI service container"
	@echo "  make shell-frontend  Open a shell in the frontend container"

up:
	docker compose up -d
	@echo ""
	@echo "  Frontend:  http://localhost:$${FRONTEND_HOST_PORT:-3000}"
	@echo "  Backend:   http://localhost:$${BACKEND_HOST_PORT:-8080}/swagger-ui.html"
	@echo "  AI svc:    http://localhost:$${AI_HOST_PORT:-8000}/docs"
	@echo ""
	@echo "  Default admin login:"
	@echo "    email:    admin@attendai.local"
	@echo "    password: Admin@12345"

down:
	docker compose down

logs:
	docker compose logs -f --tail=100

ps:
	docker compose ps

build:
	docker compose build

rebuild:
	docker compose build --no-cache
	docker compose up -d

reset:
	docker compose down -v
	@echo "Stack stopped and volumes deleted."

shell-backend:
	docker compose exec backend bash || docker compose exec backend sh

shell-ai:
	docker compose exec ai bash || docker compose exec ai sh

shell-frontend:
	docker compose exec frontend sh
