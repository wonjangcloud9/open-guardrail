#!/usr/bin/env bash
set -euo pipefail

# Release script for open-guardrail
# Usage: ./scripts/release.sh [version]
# Example: ./scripts/release.sh 1.2.0

VERSION="${1:-}"

if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/release.sh <version>"
  echo "Example: ./scripts/release.sh 1.2.0"
  exit 1
fi

echo "🚀 Releasing open-guardrail v${VERSION}"
echo ""

# 1. Verify clean working tree
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Working tree is not clean. Commit or stash changes first."
  exit 1
fi

# 2. Verify on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "❌ Not on main branch (current: $BRANCH)"
  exit 1
fi

# 3. Pull latest
echo "📥 Pulling latest..."
git pull origin main

# 4. Install + build + test
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🔨 Building..."
pnpm build

echo "🧪 Running tests..."
pnpm test

# 5. Type check
echo "🔍 Type checking..."
for pkg in packages/core packages/guards packages/open-guardrail packages/cli \
           packages/adapters/openai packages/adapters/anthropic packages/adapters/express \
           packages/adapters/fastify packages/adapters/hono packages/adapters/nextjs \
           packages/adapters/vercel-ai packages/adapters/langchain; do
  if [ -f "$pkg/tsconfig.json" ]; then
    (cd "$pkg" && npx tsc --noEmit)
  fi
done

echo ""
echo "✅ All checks passed!"
echo ""
echo "Next steps (manual):"
echo "  1. git tag v${VERSION}"
echo "  2. git push origin v${VERSION}"
echo "  3. GitHub Actions will auto-publish to npm"
echo ""
echo "Or publish manually:"
echo "  pnpm -r publish --access public --no-git-checks"
