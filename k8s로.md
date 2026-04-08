# Docker Desktop K8s → EKS + ECR 전환 계획

## Context

현재 프로젝트는 Docker Desktop Kubernetes 기준으로 구성되어 있음.

- 이미지: 로컬 빌드 (`imagePullPolicy: Never`)
- 도메인: `*.sso.local` (hosts 파일 기반)
- 인터넷 없는 오프라인 PC에서 SageMaker Jupyter를 통해 소스 수정 + 빌드 + 배포 예정

**목표:** EKS + ECR 환경으로 전환하여 SageMaker에서 빌드/배포할 수 있도록 구성.

### 확정 조건

- Ingress: NGINX Ingress Controller 유지
- 도메인: 보유 도메인 사용 (플레이스홀더: `<YOUR_DOMAIN>` 예: `sso.mycompany.com`)
- TLS: HTTP only (파일럿)
- 빌드/배포 환경: SageMaker Jupyter

### 플레이스홀더 (구현 시 실제 값으로 교체)

| 플레이스홀더 | 설명 | 예시 |
|------------|------|------|
| `<AWS_ACCOUNT_ID>` | AWS 계정 ID (12자리) | `123456789012` |
| `<AWS_REGION>` | EKS/ECR 리전 | `ap-northeast-2` |
| `<YOUR_DOMAIN>` | 보유 도메인 | `sso.mycompany.com` |
| `<EKS_CLUSTER_NAME>` | EKS 클러스터 이름 | `sso-cluster` |

---

## 변경 대상 파일

### 1. K8s Deployment 파일 (7개) — imagePullPolicy + 이미지 경로

| 파일 | 변경 내용 |
|------|---------|
| `k8s/portal/portal-deployment.yaml` | `imagePullPolicy: Never` → `IfNotPresent`, 이미지명 ECR 경로로 변경 |
| `k8s/apps/app1~5/app{n}-deployment.yaml` (5개) | 동일 |
| `k8s/keycloak/keycloak-deployment.yaml` | 공개 이미지라 경로 유지, `imagePullPolicy: IfNotPresent` 명시 |

**변경 패턴:**

```yaml
# 변경 전
image: sso-portal:latest
imagePullPolicy: Never

# 변경 후
image: <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/sso-portal:latest
imagePullPolicy: IfNotPresent
```

---

### 2. K8s Ingress 파일 (7개) — 도메인 변경

| 파일 | 변경 전 host | 변경 후 host |
|------|------------|------------|
| `k8s/portal/portal-ingress.yaml` | `portal.sso.local` | `portal.<YOUR_DOMAIN>` |
| `k8s/keycloak/keycloak-ingress.yaml` | `keycloak.sso.local` | `keycloak.<YOUR_DOMAIN>` |
| `k8s/apps/app{1-5}/app{n}-ingress.yaml` | `app{n}.sso.local` | `app{n}.<YOUR_DOMAIN>` |

> NGINX annotations(`proxy-buffer-size` 등)는 그대로 유지.

---

### 3. K8s ConfigMap 파일 (7개) — URL 환경변수 변경

| 파일 | 변경 환경변수 | 변경 내용 |
|------|------------|---------|
| `k8s/keycloak/keycloak-configmap.yaml` | `KC_HOSTNAME` | `keycloak.<YOUR_DOMAIN>` |
| `k8s/portal/portal-configmap.yaml` | `KEYCLOAK_ISSUER_URI` | `http://keycloak.<YOUR_DOMAIN>/realms/sso-pilot` |
| `k8s/apps/app{1-5}/app{n}-configmap.yaml` | `APP_HOST`, `KEYCLOAK_ISSUER_URI` | `app{n}.<YOUR_DOMAIN>`, `http://keycloak.<YOUR_DOMAIN>/realms/sso-pilot` |

> `application.yml`은 환경변수 참조 구조(`${APP_HOST}` 등)라 configmap 변경만으로 충분. 코드 수정 불필요.

---

### 4. Keycloak realm-export.json — URL 변경

`keycloak/realm-export.json`

```json
// 변경 전
"frontendUrl": "http://keycloak.sso.local"
"redirectUris": ["http://portal.sso.local/login/oauth2/code/keycloak"]
"webOrigins": ["http://portal.sso.local"]

// 변경 후
"frontendUrl": "http://keycloak.<YOUR_DOMAIN>"
"redirectUris": ["http://portal.<YOUR_DOMAIN>/login/oauth2/code/keycloak"]
"webOrigins": ["http://portal.<YOUR_DOMAIN>"]
```

portal-client, app1~5-client 각각의 `redirectUris`, `webOrigins` 모두 변경.

---

### 5. Portal SecurityConfig.java — logout URL 환경변수화

`portal/src/main/java/com/sso/portal/config/SecurityConfig.java`

```java
// 변경 전 (하드코딩)
"http://keycloak.sso.local/realms/sso-pilot/protocol/openid-connect/logout"
+ "?redirect_uri=http://portal.sso.local/"

// 변경 후 (환경변수 참조)
${keycloak.logout-url}
```

`portal/src/main/resources/application.yml`에 추가:

```yaml
keycloak:
  logout-url: ${KEYCLOAK_LOGOUT_URL:http://keycloak.<YOUR_DOMAIN>/realms/sso-pilot/protocol/openid-connect/logout?redirect_uri=http://portal.<YOUR_DOMAIN>/}
```

---

### 6. App SecurityConfig.java — logout URL 환경변수화 (app1~5)

`apps/app{n}/src/main/java/com/sso/app/config/SecurityConfig.java`

```java
// 변경 전 (하드코딩)
"http://keycloak.sso.local/realms/sso-pilot/protocol/openid-connect/logout"
+ "?redirect_uri=http://portal.sso.local/"

// 변경 후 (환경변수 참조)
${keycloak.logout-url}
```

`apps/app{n}/src/main/resources/application.yml`에 추가:

```yaml
keycloak:
  logout-url: ${KEYCLOAK_LOGOUT_URL:http://keycloak.<YOUR_DOMAIN>/realms/sso-pilot/protocol/openid-connect/logout?redirect_uri=http://portal.<YOUR_DOMAIN>/}
```

---

### 7. scripts/build-all.sh — ECR 빌드 + 푸시로 교체

```bash
#!/bin/bash
ECR_REGISTRY="<AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com"

# ECR 로그인
aws ecr get-login-password --region <AWS_REGION> \
  | docker login --username AWS --password-stdin $ECR_REGISTRY

# portal 빌드 + push
docker build -t $ECR_REGISTRY/sso-portal:latest ./portal
docker push $ECR_REGISTRY/sso-portal:latest

# app1~5 빌드 + push
for i in 1 2 3 4 5; do
  docker build -t $ECR_REGISTRY/sso-app${i}:latest ./apps/app${i}
  docker push $ECR_REGISTRY/sso-app${i}:latest
done
```

---

### 8. 신규 파일: scripts/ecr-setup.sh — ECR 레포지토리 생성 (최초 1회)

```bash
#!/bin/bash
REGION="<AWS_REGION>"

for repo in sso-portal sso-app1 sso-app2 sso-app3 sso-app4 sso-app5; do
  aws ecr create-repository --repository-name $repo --region $REGION
  echo "Created: $repo"
done
```

---

### 9. 신규 파일: scripts/deploy-eks.sh — EKS 배포 스크립트

```bash
#!/bin/bash

# NGINX Ingress Controller 설치 (최초 1회)
# kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.0/deploy/static/provider/cloud/deploy.yaml

kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/keycloak/
kubectl apply -f k8s/portal/
for i in 1 2 3 4 5; do
  kubectl apply -f k8s/apps/app${i}/
done

echo "Deploy complete. Check status:"
echo "  kubectl get pods -n sso-pilot"
echo "  kubectl get ingress -n sso-pilot"
```

---

### 10. README.md — EKS 배포 절차 섹션 추가

- SageMaker에서의 빌드/배포 워크플로우
- EKS 전제조건 (kubectl context 설정, ECR 권한)
- 도메인 DNS 설정 안내 (NGINX Ingress의 LoadBalancer IP → Route53 A 레코드)

---

## SageMaker 빌드/배포 워크플로우

### 전제조건 (최초 1회 설정)

```bash
# 1. AWS 자격증명 설정 (IAM Role 사용 시 생략 가능)
aws configure

# 2. EKS kubeconfig 설정
aws eks update-kubeconfig --name <EKS_CLUSTER_NAME> --region <AWS_REGION>

# 3. ECR 레포지토리 생성
bash scripts/ecr-setup.sh

# 4. NGINX Ingress Controller 설치
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.0/deploy/static/provider/cloud/deploy.yaml
```

### 반복 배포 흐름

```
1. git clone 또는 git pull     # 소스 가져오기
2. 소스 수정 (Jupyter에서 편집)
3. bash scripts/build-all.sh  # Docker 빌드 + ECR 푸시 (의존성 자동 다운로드)
4. bash scripts/deploy-eks.sh # kubectl apply → EKS 배포
```

### DNS 설정 (최초 1회)

```bash
# NGINX Ingress의 LoadBalancer 주소 확인
kubectl get svc -n ingress-nginx

# 출력된 EXTERNAL-IP를 Route53 또는 DNS에 A 레코드로 등록
# portal.<YOUR_DOMAIN>    → <EXTERNAL-IP>
# keycloak.<YOUR_DOMAIN>  → <EXTERNAL-IP>
# app1.<YOUR_DOMAIN>      → <EXTERNAL-IP>
# app2~5 동일
```

---

## 구현 순서

1. `scripts/ecr-setup.sh` 신규 생성
2. `scripts/build-all.sh` 수정 (ECR 경로 + push)
3. `scripts/deploy-eks.sh` 신규 생성
4. K8s Deployment 7개 수정 (`imagePullPolicy` + 이미지 경로)
5. K8s Ingress 7개 수정 (host 도메인)
6. K8s ConfigMap 7개 수정 (URL 환경변수)
7. `keycloak/realm-export.json` 수정 (URL 전체)
8. `portal/src/main/java/.../SecurityConfig.java` logout URL 환경변수화
9. `apps/app{1-5}/src/main/java/.../SecurityConfig.java` logout URL 환경변수화
10. `portal/src/main/resources/application.yml` `keycloak.logout-url` 추가
11. `apps/app{n}/src/main/resources/application.yml` `keycloak.logout-url` 추가
12. `README.md` 업데이트

---

## 검증 방법

```bash
# 1. ECR 레포 생성 확인
bash scripts/ecr-setup.sh

# 2. 빌드 + ECR 푸시
bash scripts/build-all.sh
# → AWS 콘솔 ECR에서 이미지 업로드 확인

# 3. EKS 배포
bash scripts/deploy-eks.sh
kubectl get pods -n sso-pilot       # 전체 Running 확인
kubectl get ingress -n sso-pilot    # NGINX Ingress ADDRESS 확인

# 4. 접속 확인
# DNS 등록 후: http://portal.<YOUR_DOMAIN>
# → Keycloak 로그인 페이지 → alice 로그인 → SSO 흐름 + 메뉴 권한 확인
```
