# K8s Deployment Guide - Studio Booking App

## Prerequisites

1. **Minikube installed and running**
   ```bash
   minikube start
   ```

2. **kubectl configured**
   ```bash
   kubectl config use-context minikube
   ```

3. **Docker images loaded into minikube**
   ```bash
   minikube image load the_startup-backend:latest
   minikube image load the_startup-frontend:latest
   ```

## Quick Start

### Step 1: Apply All Manifests

```bash
# Apply in order (secrets first, then others)
kubectl apply -f k8s/secrets.yml
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/postgres.yml
kubectl apply -f k8s/backend-deployment.yml
kubectl apply -f k8s/frontend-deployment.yml
kubectl apply -f k8s/ingress.yml
```

### Step 2: Verify Deployment

```bash
# Check pods
kubectl get pods -n startup

# Check services
kubectl get svc -n startup

# Check PVC
kubectl get pvc -n startup
```

### Step 3: Access the Application

```bash
# Get ingress IP (if using ingress)
kubectl get ingress -n startup

# Or use port-forward for testing
kubectl port-forward -n startup svc/studio-booking-frontend 3000:80
kubectl port-forward -n startup svc/studio-booking-backend 8000:8000
```

## Namespace: startup

All resources are in the `startup` namespace:

```bash
# List all resources in startup namespace
kubectl get all -n startup
kubectl get pvc -n startup
kubectl get secrets -n startup
kubectl get configmap -n startup
kubectl get ingress -n startup
```

## Secrets Management

All sensitive data is in `k8s/secrets.yml`:

| Key | Description |
|-----|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | PostgreSQL database name |
| `SECRET_KEY` | JWT secret key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration |

### Generating a New SECRET_KEY

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### About stringData

The secrets use `stringData` field - kubectl automatically encodes values to base64 when applying. This is the recommended approach for K8s secrets.

## PostgreSQL StatefulSet

PostgreSQL is deployed as a **StatefulSet** with:

- **PersistentVolumeClaim**: 1Gi storage (ReadWriteOnce)
- **StorageClass**: standard
- **Data persists** across pod restarts

### Check PostgreSQL Data

```bash
# Connect to PostgreSQL pod
kubectl exec -it -n startup studio-booking-postgres-0 -- psql -U studio_app -d studiobook_db

# Check tables
kubectl exec -it -n startup studio-booking-postgres-0 -- psql -U studio_app -d studiobook_db -c "\dt"
```

## Troubleshooting

### Pod not starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n startup

# Check logs
kubectl logs <pod-name> -n startup
```

### PVC not binding

```bash
# Check PVC status
kubectl get pvc -n startup

# Check PVC events
kubectl describe pvc studio-booking-postgres-pvc -n startup
```

### Secrets not working

```bash
# Verify secrets exist
kubectl get secrets -n startup

# Check secret values
kubectl get secret studio-booking-secrets -n startup -o yaml
```

## Cleanup

```bash
# Delete all resources
kubectl delete -f k8s/

# Or selectively
kubectl delete -f k8s/postgres.yml
kubectl delete -f k8s/backend-deployment.yml
kubectl delete -f k8s/frontend-deployment.yml
```

## Environment Variables

| Variable | Source | Example |
|----------|--------|---------|
| DATABASE_URL | Secret | `postgresql://...@postgres:5432/db` |
| SECRET_KEY | Secret | JWT signing key |
| ACCESS_TOKEN_EXPIRE_MINUTES | Secret | `1440` |
| ALLOWED_ORIGINS | ConfigMap | `https://yourdomain.com` |
| ENVIRONMENT | ConfigMap | `production` |
| API_BASE_URL | ConfigMap | `http://backend:8000` |

## Secret Manager Integration

To use external secret managers, replace `secretRef` in deployments:

### AWS Secrets Manager with External Secrets Operator
```yaml
envFrom:
  - secretRef:
      name: studio-booking-secrets
# Replace with:
  - secretRef:
      name: aws-secrets-manager-secret
```

### HashiCorp Vault
```yaml
envFrom:
  - secretRef:
      name: vault-secret
```

## Scaling

```bash
# Scale backend
kubectl scale deployment studio-booking-backend -n startup --replicas=3

# Scale frontend
kubectl scale deployment studio-booking-frontend -n startup --replicas=3
```

## Notes

- All resources are in `startup` namespace
- Secrets use `stringData` (kubectl auto-encodes to base64)
- PostgreSQL StatefulSet uses stable network identity
- Data persists via PVC even after pod deletion
- Use `kubectl get events -n startup --sort-by='.lastTimestamp'` for debugging