#!/bin/bash
# OneHealth - Quick Start Script
# Usage: ./start.sh [dev|prod|init]

set -e

MODE="${1:-dev}"

echo "================================"
echo "  OneHealth Platform"
echo "================================"
echo ""

case $MODE in
  dev)
    echo "🚀 Starting OneHealth in Development Mode..."
    echo ""

    # Check Docker
    if ! command -v docker &> /dev/null || ! docker info &> /dev/null; then
      echo "❌ Docker is not running. Please start Docker Desktop first."
      exit 1
    fi

    # Start infrastructure
    echo "📦 Starting infrastructure services..."
    docker-compose up -d postgres redis minio

    # Wait for postgres
    echo "⏳ Waiting for PostgreSQL..."
    for i in $(seq 1 30); do
      if docker-compose exec -T postgres pg_isready &>/dev/null; then
        echo "✓ PostgreSQL ready"
        break
      fi
      sleep 1
    done

    # Seed database
    echo "🌱 Seeding database..."
    docker-compose run --rm init-db

    # Start all services
    echo "🔧 Building and starting all services..."
    docker-compose up --build -d

    echo ""
    echo "✅ OneHealth is running!"
    echo ""
    echo "📍 Services:"
    echo "   Landing Page:     http://localhost:3000"
    echo "   Doctor Dashboard: http://localhost:3001"
    echo "   Auth API:         http://localhost:5000"
    echo "   Identity API:     http://localhost:5001"
    echo "   MinIO Console:    http://localhost:9001"
    echo ""
    echo "🔐 Test Credentials:"
    echo "   Admin:    admin@onehealth.example.com / Admin@123"
    echo "   Doctor:   dr.rao@onehealth.example.com / Doctor@123"
    echo "   Patient:  priya.sharma@example.com / Patient@123"
    echo ""
    ;;

  prod)
    echo "🚀 Starting OneHealth in Production Mode..."
    echo "⚠️  Make sure you have a valid .env file configured"
    echo ""
    docker-compose -f docker-compose.yml up -d
    ;;

  init)
    echo "🌱 Initializing database..."
    docker-compose run --rm init-db
    echo "✓ Database initialized"
    ;;

  stop)
    echo "⏹️  Stopping OneHealth..."
    docker-compose down
    echo "✓ Stopped"
    ;;

  logs)
    echo "📋 Showing logs (last 100 lines)..."
    docker-compose logs --tail=100 -f "$@"
    ;;

  *)
    echo "Usage: ./start.sh [dev|prod|init|stop|logs]"
    echo ""
    echo "  dev    - Start all services (default)"
    echo "  prod   - Start in production mode"
    echo "  init   - Run database initialization"
    echo "  stop   - Stop all services"
    echo "  logs   - View logs"
    exit 1
    ;;
esac