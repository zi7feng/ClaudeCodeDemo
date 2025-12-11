#!/bin/bash
set -e

echo "=== Weight Stock Platform Deployment ==="

# Detect docker compose command (v2 uses 'docker compose', v1 uses 'docker-compose')
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif docker-compose version &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "Error: Neither 'docker compose' nor 'docker-compose' found."
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "Using: $DOCKER_COMPOSE"

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    # Generate a random secret key
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || openssl rand -hex 32)
    # Use sed with compatibility for both macOS and Linux
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-secret-key-here/$SECRET_KEY/" .env
    else
        # Linux
        sed -i "s/your-secret-key-here/$SECRET_KEY/" .env
    fi
    echo "Generated new SECRET_KEY in .env"
fi

# Build and start containers
echo "Building and starting containers..."
$DOCKER_COMPOSE up --build -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 5

# Show status
$DOCKER_COMPOSE ps

echo ""
echo "=== Deployment Complete ==="
echo "Application is running at: http://localhost"
echo ""
echo "Useful commands:"
echo "  View logs:     $DOCKER_COMPOSE logs -f"
echo "  Stop:          $DOCKER_COMPOSE down"
echo "  Restart:       $DOCKER_COMPOSE restart"
echo "  View backend:  $DOCKER_COMPOSE logs backend"
