# SSO 파일럿 프로젝트

Keycloak + Kubernetes 기반 Single Sign-On 파일럿 구현

---

## 1. 프로젝트 개요 및 목표

이 프로젝트는 엔터프라이즈 환경의 SSO(Single Sign-On)를 실제로 구현하고 검증하기 위한 파일럿이다.

**핵심 목표:**
- Keycloak을 IdP(Identity Provider)로 사용하는 SSO 환경 구축
- Portal 앱에서 1회 로그인 후 구독된 앱에 **자동 로그인** 되는 흐름 구현
- `prompt=none` OIDC 파라미터를 활용한 투명한 SSO 처리
- 역할(Role) 기반 앱 구독 관리 (구독/미구독 분기)
- Docker Desktop Kubernetes 위에서 전체 스택 동작 검증

---

## 2. 시스템 아키텍처

```
Browser
  └── NGINX Ingress (localhost:80)
       ├── keycloak.sso.local  → keycloak Pod (8080)
       ├── portal.sso.local    → portal Pod (8080)
       ├── app1.sso.local      → app1 Pod (8080)
       ├── app2.sso.local      → app2 Pod (8080)
       ├── app3.sso.local      → app3 Pod (8080)
       ├── app4.sso.local      → app4 Pod (8080)
       └── app5.sso.local      → app5 Pod (8080)
```

### SSO Flow - 구독 앱 접근

```
Portal 로그인
  → Keycloak SSO 쿠키 생성
  → App 타일 클릭
  → Portal RedirectController: role 확인 (구독됨)
  → App URL로 리다이렉트
  → App이 prompt=none OIDC 요청
  → Keycloak 기존 세션 확인
  → 자동 로그인 완료
```

### SSO Flow - 미구독 앱 접근

```
App 타일 클릭
  → Portal RedirectController: role 없음 감지
  → App /denied 페이지로 리다이렉트
```

> **포트 충돌 없음**: 모든 앱이 8080 포트를 사용해도 K8s에서 완전히 정상 동작한다.
> 각 Pod는 독립 네트워크 namespace를 가지며, Ingress는 도메인(Host header)으로 라우팅하기 때문이다.

---

## 3. 기술 스택

| 컴포넌트 | 기술 |
|----------|------|
| IdP | Keycloak 24.x |
| Keycloak DB | PostgreSQL 16 |
| Portal Backend | Spring Boot 3.x + Spring Security OAuth2 Client |
| Portal Frontend | React 18 + Vite (Spring Boot가 빌드 결과물 서빙) |
| Apps (5개) | Spring Boot 3.x + React 18 (동일 패턴) |
| OIDC 라이브러리 | Spring Security OAuth2 Client (내장) |
| 세션 | Spring Session in-memory (추후 Redis 전환 가능) |
| K8s | Docker Desktop Kubernetes |
| Ingress | NGINX Ingress Controller |

### PostgreSQL이 Keycloak에 필요한 이유

| 저장 데이터 | 설명 |
|-------------|------|
| Realm/Client 설정 | 역할, 권한, OIDC 클라이언트 정보 |
| 사용자 계정 | 비밀번호 해시, 이메일 등 |
| 역할 할당 | 어떤 유저가 app1-subscriber인지 등 |
| Refresh Token | 오프라인 세션 토큰 |
| 감사 로그 | 로그인 이벤트 기록 |

> PostgreSQL 없이 `start-dev` 모드를 사용하면 H2 내장 DB가 사용되며, Pod 재시작 시 **모든 설정이 소멸**된다.

### 세션 Redis 전환

현재는 in-memory 세션을 사용한다. 추후 의존성 추가만으로 Redis로 전환 가능하다.

```xml
<!-- spring-session-data-redis 추가 + Redis Pod 배포만 하면 됨 -->
<dependency>
  <groupId>org.springframework.session</groupId>
  <artifactId>spring-session-data-redis</artifactId>
</dependency>
```

---

## 4. 프로젝트 디렉토리 구조

```
D:\kc\project\sso\
├── k8s/
│   ├── namespace.yaml
│   ├── keycloak/
│   │   ├── postgres-secret.yaml
│   │   ├── postgres-pvc.yaml
│   │   ├── postgres-deployment.yaml
│   │   ├── postgres-service.yaml
│   │   ├── keycloak-secret.yaml
│   │   ├── keycloak-configmap.yaml
│   │   ├── keycloak-deployment.yaml
│   │   ├── keycloak-service.yaml
│   │   └── keycloak-ingress.yaml
│   ├── portal/
│   │   ├── portal-configmap.yaml
│   │   ├── portal-secret.yaml
│   │   ├── portal-deployment.yaml
│   │   ├── portal-service.yaml
│   │   └── portal-ingress.yaml
│   └── apps/
│       └── app{1..5}/  (각각 configmap, secret, deployment, service, ingress)
│
├── portal/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/sso/portal/
│       │   │   ├── PortalApplication.java
│       │   │   ├── config/
│       │   │   │   ├── SecurityConfig.java      # OAuth2 Login, 세션 설정
│       │   │   │   ├── SecurityConfig.java      # OAuth2 Login, 세션 설정
│       │   │   │   ├── AppRegistry.java         # 앱 타일 정의 + role 매핑
│       │   │   │   └── MenuConfig.java          # 포탈 메뉴 권한 정의 (역할↔메뉴 매핑)
│       │   │   │   ├── PortalController.java    # GET /api/apps - 타일 목록
│       │   │   │   ├── PortalController.java    # GET /api/apps, /api/me, /api/menu
│       │   │   │   └── RedirectController.java  # GET /api/redirect/{appId} (portal_perms 전달)
│       │   │       └── AppInfo.java
│       │   └── resources/
│       │       └── application.yml
│       └── frontend/                            # React + Vite
│           ├── package.json
│           ├── vite.config.js
│           └── src/
│               ├── main.jsx
│               ├── App.jsx
│               ├── pages/Dashboard.jsx          # 앱 타일 그리드 + 역할 기반 NavBar
│               └── components/
│                   ├── AppCard.jsx              # 구독/미구독 카드
│                   └── NavBar.jsx               # 역할 기반 상단 메뉴 (Data/MyService/DataCatalog/Admin)
│
├── apps/
│   └── app-template/                            # app1~app5가 복사
│       ├── Dockerfile
│       ├── pom.xml
│       └── src/
│           ├── main/
│           │   ├── java/com/sso/app/
│           │   │   ├── AppApplication.java
│           │   │   ├── config/SecurityConfig.java
│           │   │   └── controller/
│           │   │       ├── AppController.java   # GET /api/me - 로그인 유저 정보
│           │   │       └── DeniedController.java # GET /denied
│           │   └── resources/application.yml
│           └── frontend/
│               ├── package.json
│               └── src/
│                   ├── main.jsx
│                   ├── App.jsx
│                   ├── pages/Home.jsx           # 앱 메인 화면
│                   └── pages/Denied.jsx         # 접근 거부 화면
│
├── keycloak/
│   └── realm-export.json
└── scripts/
    ├── build-all.sh
    ├── deploy-all.sh
    └── setup-hosts.ps1
```

---

## 5. 핵심 구현 설명

### 5-1. Portal (Spring Boot + React)

Portal은 SSO 환경의 허브 역할을 한다. 사용자가 최초 로그인하는 곳이며, 각 앱으로의 접근 권한을 판단하고 라우팅한다.

**SecurityConfig.java**

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/index.html", "/assets/**", "/health").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .defaultSuccessUrl("/", true)
            )
            .logout(logout -> logout
                .logoutSuccessUrl("http://keycloak.sso.local/realms/sso-pilot/protocol/openid-connect/logout"
                    + "?redirect_uri=http://portal.sso.local/")
            );
        return http.build();
    }
}
```

**application.yml**

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          keycloak:
            client-id: portal-client
            client-secret: ${KEYCLOAK_CLIENT_SECRET}
            scope: openid,profile,email,roles
            authorization-grant-type: authorization_code
            redirect-uri: "http://portal.sso.local/login/oauth2/code/keycloak"
        provider:
          keycloak:
            issuer-uri: http://keycloak:8080/realms/sso-pilot
            user-name-attribute: preferred_username
```

**RedirectController.java (구독 분기 + 메뉴 권한 전달)**

```java
@GetMapping("/api/redirect/{appId}")
public ResponseEntity<Void> redirect(@PathVariable String appId,
                                     @AuthenticationPrincipal OAuth2User user) {
    AppInfo app = appRegistry.findById(appId).orElseThrow(...);
    List<String> roles = PortalController.extractRoles(user);

    if (roles.contains(app.getRequiredRole())) {
        // 구독됨: 허용 메뉴 목록을 쿼리 파라미터로 앱에 전달
        List<String> allowedMenus = menuConfig.getAllowedMenuIds(roles);
        String perms = String.join(",", allowedMenus);
        return ResponseEntity.status(302)
            .location(URI.create(app.getUrl() + "/?portal_perms=" + perms)).build();
    } else {
        // 미구독: 거부 페이지
        return ResponseEntity.status(302)
            .location(URI.create(app.getUrl() + "/denied?from=portal")).build();
    }
}
```

**PortalController.java - /api/me 응답 (roles + allowedMenus 포함)**

```java
@GetMapping("/me")
public Map<String, Object> getMe(@AuthenticationPrincipal OAuth2User user) {
    List<String> roles = extractRoles(user);
    List<String> allowedMenus = menuConfig.getAllowedMenuIds(roles);
    return Map.of(
        "username", ...,
        "email", ...,
        "roles", roles,           // ["customer"] / ["developer"] / ["admin"]
        "allowedMenus", allowedMenus  // ["data","myservice"] 등
    );
}

// 앱에서 포탈에 직접 권한 조회 가능한 엔드포인트
@GetMapping("/menu")
public List<Map<String, String>> getMenu(@AuthenticationPrincipal OAuth2User user) {
    List<String> roles = extractRoles(user);
    return menuConfig.getAllowedMenus(roles).stream()
        .map(m -> Map.of("id", m.id(), "label", m.label()))
        .toList();
}
```

### 5-2. App Template (prompt=none SSO)

5개의 앱은 모두 동일한 구조를 사용한다. 핵심은 `prompt=none` 파라미터를 통해 Keycloak 기존 세션을 조용히 확인하는 것이다.

**SecurityConfig.java (prompt=none SSO)**

```java
// 앱의 OIDC 로그인 시 prompt=none 파라미터 추가
@Bean
public OAuth2AuthorizationRequestResolver authRequestResolver(
        ClientRegistrationRepository repo) {
    DefaultOAuth2AuthorizationRequestResolver resolver =
        new DefaultOAuth2AuthorizationRequestResolver(repo, "/oauth2/authorization");
    resolver.setAuthorizationRequestCustomizer(customizer ->
        customizer.additionalParameters(params -> params.put("prompt", "none"))
    );
    return resolver;
}

// prompt=none 실패 시 (login_required) → /denied로 리다이렉트
@Bean
public AuthenticationFailureHandler failureHandler() {
    return (request, response, exception) -> {
        response.sendRedirect("/denied?reason=no_sso_session");
    };
}
```

**application.yml**

```yaml
app:
  name: Analytics Dashboard      # 각 앱마다 다름
  required-role: app1-subscriber # 각 앱마다 다름
  host: app1.sso.local

spring:
  security:
    oauth2:
      client:
        registration:
          keycloak:
            client-id: app1-client
            client-secret: ${KEYCLOAK_CLIENT_SECRET}
            scope: openid,profile,email,roles
            redirect-uri: "http://app1.sso.local/login/oauth2/code/keycloak"
        provider:
          keycloak:
            issuer-uri: http://keycloak:8080/realms/sso-pilot
```

### 5-3. Keycloak 설정 (Realm, Clients, Roles, Users)

**Realm: `sso-pilot`**
- Frontend URL: `http://keycloak.sso.local`

**Clients (6개)**

| Client ID | Valid Redirect URI | 타입 |
|-----------|-------------------|------|
| portal-client | `http://portal.sso.local/login/oauth2/code/keycloak` | confidential |
| app1-client | `http://app1.sso.local/login/oauth2/code/keycloak` | confidential |
| app2~5-client | (동일 패턴) | confidential |

- Spring Security OAuth2 콜백 경로: `/login/oauth2/code/{registrationId}`
- `portal-client`에 **Realm Roles 매퍼** 추가 필수 → token claim name: `roles`

**Realm Roles (8개)**

앱 구독 role (5개): `app1-subscriber`, `app2-subscriber`, `app3-subscriber`, `app4-subscriber`, `app5-subscriber`

사용자 유형 role (3개): `customer`, `developer`, `admin`

**테스트 유저**

| 유저 | 비밀번호 | 구독 앱 |
|------|----------|---------|
| alice | alice123 | app1, app2, app3 |
| bob | bob123 | app1, app4 |
| charlie | charlie123 | 없음 |

**5개 앱 정의**

| App | 이름 | 아이콘 | Required Role | 포트 |
|-----|------|--------|---------------|------|
| app1 | Analytics Dashboard | 📊 | app1-subscriber | 8080 |
| app2 | Document Manager | 📁 | app2-subscriber | 8080 |
| app3 | HR Portal | 👥 | app3-subscriber | 8080 |
| app4 | Finance Tracker | 💰 | app4-subscriber | 8080 |
| app5 | Support Center | 🎫 | app5-subscriber | 8080 |

### 5-4. 역할 기반 메뉴 권한 (MenuConfig)

포탈 상단에 Data, MyService, DataCatalog, Admin 4개의 메뉴가 존재하며, 사용자 유형 역할에 따라 접근 가능한 메뉴가 결정된다.

**메뉴 권한 매핑**

| 메뉴 | customer | developer | admin |
|------|:--------:|:---------:|:-----:|
| Data | O | O | O |
| MyService | O | O | O |
| DataCatalog | X | O | O |
| Admin | X | X | O |

**MenuConfig.java**

```java
private static final Map<String, List<String>> ROLE_MENUS = Map.of(
    "customer",  List.of("data", "myservice"),
    "developer", List.of("data", "myservice", "datacatalog"),
    "admin",     List.of("data", "myservice", "datacatalog", "admin")
);
```

**메뉴 권한 전달 흐름**

```
1. 포탈 로그인 → /api/me 응답에 allowedMenus 포함 → 포탈 NavBar 표시
2. 앱 타일 클릭 → /api/redirect/{appId}
   → http://app1.sso.local/?portal_perms=data,myservice  (구독 있을 때)
3. 앱 프론트엔드: URL에서 portal_perms 읽어 sessionStorage 저장 후 URL 정리
4. 앱 헤더에 동일한 NavBar 표시
5. (선택) 앱에서 직접 포탈 /api/menu 호출로 최신 권한 조회 가능
```

> **직접 접속 시**: 앱을 포탈 거치지 않고 직접 접속하면 `portal_perms`가 없어 sessionStorage에 권한 정보가 없다. 이 경우 앱 NavBar는 표시되지 않는다.

---

## 6. Docker 빌드 전략 (멀티스테이지)

Portal과 각 앱 모두 3단계 멀티스테이지 빌드를 사용한다. React 빌드 결과물을 Spring Boot의 static 리소스로 통합하여 단일 JAR로 서빙한다.

**Portal Dockerfile**

```dockerfile
# Stage 1: React 빌드
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY src/frontend/package*.json ./
RUN npm ci
COPY src/frontend/ ./
RUN npm run build  # → dist/ 폴더 생성

# Stage 2: Spring Boot 빌드
FROM eclipse-temurin:21-jdk AS backend-build
WORKDIR /app
COPY pom.xml .
COPY src/main/ ./src/main/
# React 빌드 결과물을 Spring Boot static으로 복사
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static/
RUN ./mvnw package -DskipTests

# Stage 3: 실행 이미지
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend-build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 7. K8s 핵심 설정

### NGINX 버퍼 설정 (모든 Ingress에 필수)

OIDC 인증 흐름에서 Keycloak이 반환하는 헤더가 기본 버퍼 크기를 초과할 수 있다. 모든 Ingress에 반드시 추가해야 한다.

```yaml
annotations:
  nginx.ingress.kubernetes.io/proxy-buffer-size: "128k"
  nginx.ingress.kubernetes.io/proxy-buffers-number: "8"
```

### 로컬 Docker 이미지 사용 (Docker Desktop)

Docker Desktop에서 빌드한 이미지는 로컬에만 존재한다. `imagePullPolicy: Never`를 설정하지 않으면 K8s가 원격 레지스트리에서 이미지를 찾으려다 실패한다.

```yaml
imagePullPolicy: Never
image: sso-portal:latest
```

### Keycloak init container (PostgreSQL 대기)

Keycloak Pod가 PostgreSQL보다 먼저 시작되면 DB 연결 실패로 크래시된다. init container로 PostgreSQL이 준비될 때까지 대기한다.

```yaml
initContainers:
- name: wait-for-postgres
  image: busybox
  command: ['sh', '-c', 'until nc -z postgres 5432; do sleep 2; done']
```

---

## 8. 배포 단계별 절차

### Step 0. Secret 파일 준비 (최초 1회)

Secret 파일은 `.gitignore`로 제외되어 있다. `.example` 파일을 복사한 후 실제 값을 입력해야 한다.

```bash
# .example → 실제 secret 파일 복사
cp k8s/keycloak/postgres-secret.yaml.example  k8s/keycloak/postgres-secret.yaml
cp k8s/keycloak/keycloak-secret.yaml.example  k8s/keycloak/keycloak-secret.yaml
cp k8s/portal/portal-secret.yaml.example      k8s/portal/portal-secret.yaml
cp k8s/apps/app1/app1-secret.yaml.example     k8s/apps/app1/app1-secret.yaml
cp k8s/apps/app2/app2-secret.yaml.example     k8s/apps/app2/app2-secret.yaml
cp k8s/apps/app3/app3-secret.yaml.example     k8s/apps/app3/app3-secret.yaml
cp k8s/apps/app4/app4-secret.yaml.example     k8s/apps/app4/app4-secret.yaml
cp k8s/apps/app5/app5-secret.yaml.example     k8s/apps/app5/app5-secret.yaml
```

각 파일을 열어 `REPLACE_WITH_*` 값을 실제 비밀번호/시크릿으로 교체한다:

- `postgres-secret.yaml`: PostgreSQL 비밀번호 설정
- `keycloak-secret.yaml`: Keycloak 관리자 비밀번호, DB 비밀번호 설정
- `portal-secret.yaml`, `app{1-5}-secret.yaml`: Step 3 Keycloak 설정 완료 후 Client Secret 입력

> **주의**: 복사된 `*-secret.yaml` 파일은 절대 git에 커밋하지 말 것. `.gitignore`로 자동 제외된다.

---

### Step 1. 사전 준비

NGINX Ingress Controller 설치:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.0/deploy/static/provider/cloud/deploy.yaml
```

Windows hosts 파일 수정 (`C:\Windows\System32\drivers\etc\hosts`):

```
127.0.0.1  keycloak.sso.local portal.sso.local app1.sso.local app2.sso.local app3.sso.local app4.sso.local app5.sso.local
```

### Step 2. K8s 배포 (순서 중요)

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/keycloak/    # postgres → keycloak 순으로 적용됨
kubectl apply -f k8s/portal/
kubectl apply -f k8s/apps/app1/
kubectl apply -f k8s/apps/app2/
kubectl apply -f k8s/apps/app3/
kubectl apply -f k8s/apps/app4/
kubectl apply -f k8s/apps/app5/
```

### Step 3. Keycloak 설정 (`http://keycloak.sso.local`)

아래 순서를 지켜야 한다:

1. Realm `sso-pilot` 생성 → Realm Settings → Frontend URL: `http://keycloak.sso.local`
2. Realm Roles 8개 생성:
   - 앱 구독: `app1-subscriber` ~ `app5-subscriber`
   - 사용자 유형: `customer`, `developer`, `admin`
3. Clients 6개 생성 (Valid Redirect URI 정확히 입력, Spring Security 콜백 경로 주의)
4. `portal-client` → Client Scopes → Realm Roles 매퍼 추가 (token claim name: `roles`)
5. 테스트 유저 3명 생성 + 각 유저에 role 할당:
   - alice: `customer` + `app1-subscriber`, `app2-subscriber`, `app3-subscriber`
   - bob: `developer` + `app1-subscriber`, `app4-subscriber`
   - charlie: `admin`
6. 각 Client의 Secret 복사 → `k8s/*-secret.yaml` 파일의 `REPLACE_WITH_*_CLIENT_SECRET` 값 교체

### Step 4. 이미지 빌드 및 재배포

```bash
bash scripts/build-all.sh          # 각 앱 docker build 수행
kubectl rollout restart deployment -n sso-pilot
```

---

## 9. 검증 시나리오

| 시나리오 | 예상 결과 |
|---------|---------|
| `http://portal.sso.local` 접속 | Keycloak 로그인 페이지로 리다이렉트 |
| alice로 로그인 | app1, app2, app3 "Open App" 버튼 / app4, app5 "Request Access" 버튼 표시 |
| alice → app1 타일 클릭 | 로그인 없이 Analytics Dashboard 접속 (SSO 자동 로그인) |
| alice → app4 타일 클릭 | 접근 거부 페이지 (`/denied`) 표시 |
| charlie로 로그인 | 모든 앱 잠금 상태 (Request Access만 표시) |
| `http://app1.sso.local` 직접 접속 | Keycloak 로그인 프롬프트 표시 (Portal 세션 없음) |

---

## 10. 주요 주의사항

**Spring Security OAuth2 콜백 URI**
- 경로: `/login/oauth2/code/{registrationId}` (Node.js passport 등과 다름)
- Keycloak Client의 Valid Redirect URI와 `application.yml`의 `redirect-uri`가 정확히 일치해야 한다

**prompt=none 실패 처리**
- Keycloak 세션이 없을 때 `login_required` 에러 반환
- `AuthenticationFailureHandler`에서 캐치하여 `/denied`로 리다이렉트 처리 필수

**Keycloak issuer-uri 구분**
- Pod 내부 (K8s DNS): `http://keycloak:8080/realms/sso-pilot`
- 브라우저 (외부 접근): `http://keycloak.sso.local/realms/sso-pilot`
- `application.yml`의 `issuer-uri`는 **Pod 내부 주소**를 사용해야 한다

**React Vite 개발 서버 프록시**
- 로컬 개발 시 `vite.config.js`에서 API 요청을 Spring Boot(localhost:8080)로 프록시 설정 필요
- 프로덕션(Docker 빌드)에서는 Spring Boot가 직접 static 파일을 서빙하므로 불필요

**Realm Roles 매퍼**
- `portal-client`에 Realm Roles 매퍼를 추가하지 않으면 JWT에 role 정보가 포함되지 않는다
- `RedirectController`의 role 추출 로직이 빈 리스트를 반환하여 모든 앱이 미구독으로 처리됨
