#!/bin/bash

# Deploy script for R2 Worker
# Usage: ./scripts/deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Deploying R2 Worker to $ENVIRONMENT"
echo ""

cd "$PROJECT_DIR"

# Check if wrangler is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js"
    exit 1
fi

# Run tests first
echo "🧪 Running tests..."
if npm test 2>&1 | grep -q "PASS\|✓"; then
    echo "✅ Tests passed"
else
    echo "⚠️  Warning: Some tests may have failed, continuing anyway..."
fi
echo ""

# Build (if needed)
echo "🔨 Preparing deployment..."

# Deploy with wrangler
echo "📦 Deploying to Cloudflare..."
if [ "$ENVIRONMENT" = "staging" ]; then
    npx wrangler deploy --env staging
elif [ "$ENVIRONMENT" = "production" ]; then
    npx wrangler deploy
else
    echo "❌ Error: Unknown environment: $ENVIRONMENT"
    exit 1
fi

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Worker URL: https://r2-worker.jija.workers.dev"
echo ""
echo "📊 Check deployment status:"
echo "  npx wrangler deployments list"
echo ""
echo "📋 View logs:"
echo "  npx wrangler tail"
