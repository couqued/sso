#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(dirname "$SCRIPT_DIR")/k8s"

echo "=== Deploying Namespace ==="
kubectl apply -f "$K8S_DIR/namespace.yaml"

echo "=== Deploying Keycloak stack ==="
kubectl apply -f "$K8S_DIR/keycloak/"

echo "Waiting for PostgreSQL to be ready..."
kubectl rollout status deployment/postgres -n sso-pilot --timeout=120s

echo "Waiting for Keycloak to be ready..."
kubectl rollout status deployment/keycloak -n sso-pilot --timeout=300s

echo "=== Deploying Portal ==="
kubectl apply -f "$K8S_DIR/portal/"
kubectl rollout status deployment/portal -n sso-pilot --timeout=120s

echo "=== Deploying Apps ==="
for i in 1 2 3 4 5; do
  echo "--- Deploying app${i} ---"
  kubectl apply -f "$K8S_DIR/apps/app${i}/"
done

echo ""
echo "=== Deployment complete ==="
kubectl get pods -n sso-pilot
kubectl get ingress -n sso-pilot
