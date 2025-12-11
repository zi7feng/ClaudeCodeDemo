#!/bin/bash
set -e

echo "=== Weight Stock Platform Deployment ==="

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
docker compose up --build -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 5

# Show status
docker compose ps

echo ""
echo "=== Deployment Complete ==="
echo "Application is running at: http://localhost"
echo ""
echo "Useful commands:"
echo "  View logs:     docker compose logs -f"
echo "  Stop:          docker compose down"
echo "  Restart:       docker compose restart"
echo "  View backend:  docker compose logs backend"
