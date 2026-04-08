#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Building Portal ==="
docker build -t sso-portal:latest "$PROJECT_ROOT/portal"

echo "=== Building Apps ==="
for i in 1 2 3 4 5; do
  echo "--- Building app${i} ---"
  docker build -t sso-app${i}:latest "$PROJECT_ROOT/apps/app${i}"
done

echo ""
echo "=== Build complete ==="
docker images | grep sso-
