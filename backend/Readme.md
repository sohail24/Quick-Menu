# Quick Menu (Backend) 🍽️

**Quick Menu** is a QR-based, real-time digital ordering backend built with Spring Boot.  
Customers scan a table QR → view menu → place order. Staff see live order & bell notifications. This repo contains the backend MVP.

---

## 🚀 Highlights
- QR-based interactive menu — no customer app required
- Real-time order & bell notifications via WebSocket (STOMP)
- Role-based JWT authentication (ADMIN / STAFF / CUSTOMER)
- Admin metrics: orders, revenue, top dishes, hourly breakdown
- File uploads (images) and static serving
- OpenAPI (Swagger) + Postman collection & environment for quick testing
- Pagination for large lists
- Modular design ready to evolve to Kafka & Redis for scale

---

## 🧱 Tech Stack Overview

| Layer             | Technology                  | Notes                                           |
|------------------|-----------------------------|-------------------------------------------------|
| 🧩 Framework      | Spring Boot 3.5.x           | Core framework for backend REST API             |
| 🔐 Security       | Spring Security + JWT       | Token-based auth, stateless API                 |
| 💾 Database       | H2 / MySQL (configurable)   | JPA/Hibernate ORM                               |
| 🗄️ ORM            | Spring Data JPA             | Simplifies DB operations                        |
| 🔔 Real-time      | Spring WebSocket + STOMP    | Live order and bell notifications               |
| 📦 Messaging      | Kafka (planned)             | For async inter-service events                  |
| 💬 Rate Limiting  | In-memory map → Redis later | Prevent bell spam                               |
| 🖼️ File Upload    | Multipart / Static Serving  | Local uploads, can switch to S3/Cloudinary      |
| 🧾 Docs           | Swagger (OpenAPI 3)         | Auto API documentation                          |
| 🧪 Testing Tool   | Postman                     | Collection + environment for all endpoints      |
| 🧠 Language       | Java 21                     | Modern features, records, pattern matching      |
| 🧰 Build Tool     | Maven                       | Dependency and build management                 |

---

## 🧩 High-Level Architecture

```
QuickMenu (Backend)
│
├── Auth & Security (JWT)
├── Restaurant Module
│   ├── Tables (QR-based)
│   ├── Categories & Dishes
│   └── Uploads (images)
│
├── Orders Module
│   ├── Real-time updates via WebSocket
│   └── Order tracking & management
│
├── Bell Module 🔔
│   ├── Customers ring via QR (no login)
│   ├── Staff notified instantly
│   └── Ack + Analytics persisted
│
├── Admin Module
│   ├── Dashboard stats
│   ├── Top dishes, revenue, hourly data
│   └── Pagination on large datasets
│
└── WebSocket Event Layer
    ├── /topic/restaurants/{id}/orders
    └── /topic/restaurants/{id}/bells
```

---

## 🌐 API Documentation

- Static OpenAPI YAML: `src/main/resources/static/openapi.yaml`
- Swagger UI: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)

✅ Source of truth for:
- API endpoints
- Payloads, params, roles
- Team onboarding

---

## 🔐 Authentication (JWT-based)

### Endpoints
- `POST /api/auth/signup` → Create account & return JWT
- `POST /api/auth/login` → Validate & return JWT

### Key Points
- Stateless (no session)
- JWT validated via filter
- Role-based access: `ADMIN`, `STAFF`, `CUSTOMER`
- `@PreAuthorize` used on restricted endpoints

💡 _Interview Tip_:  
“We used JWT for statelessness and scalability. No session persistence, making it cloud/deployment-friendly. For production, we can add refresh tokens and httpOnly cookies.”

---

## 🍴 Restaurant Module

Handles restaurant onboarding, menu management, and tables.

### Entities
- `Restaurant`: id, name, timezone, currency
- `TableEntity`: id, name, qrUrl
- `Category`: id, name, orderIndex
- `Dish`: name, description, price, availability

### Key Endpoints
- `POST /api/restaurants` → onboard restaurant
- `POST /api/restaurants/{id}/tables` → create QR table
- `GET /api/{restaurantId}/dishes` → list menu
- `PATCH /api/{restaurantId}/dishes/{dishId}/availability` → toggle dish availability

---

## 📸 Uploads

- `POST /api/uploads` → multipart image upload
- Returns URL, supports <1.5MB (adjustable)

---

## 🧾 Orders Module

### Features
- Real-time order status updates
- Separate views for customer & staff
- Pagination on listing endpoints

### Entities
- `Order`: id, restaurantId, tableId, status, createdAt
- `OrderItem`: dishId, quantity, priceAtOrder

### Endpoints
- `POST /api/{restaurantId}/orders` → place order
- `GET /api/{restaurantId}/orders` → staff view
- `PATCH /api/{restaurantId}/orders/{orderId}` → change status (staff)

---

## 🔔 Bell Module (Ring-the-Bell Feature)

### Why?
Customers can notify waiters instantly (no yelling 😅).

### Flow
1. Customer scans QR
2. `POST /api/restaurants/{restaurantId}/tables/{tableId}/bell`
3. Event is persisted + published via WebSocket
4. Staff dashboard receives live alert
5. `PATCH /api/{restaurantId}/bells/{bellId}/ack` → mark as handled

### Entity: `BellEvent`
- id, restaurantId, tableId, message, source
- status (PENDING/ACKED/TIMEOUT)
- createdAt, ackBy, ackAt, delivered, attempts

### Key Points
- Persists for audit + metrics
- Rate-limited per table (20s cooldown)
- Delivered via WebSocket → `/topic/restaurants/{id}/bells`
- `ackBy` extracted from Spring Security Principal

💡 _NOTE_:  
“We used an event-persistence-first pattern. Every bell is stored for analytics and SLA metrics (time to acknowledgment). Real-time delivery is via WebSocket for instant alerts. For scalability, we’d later offload events to Kafka and Redis for cross-instance delivery and distributed rate-limiting.”

---

## 🧑‍💼 Admin Dashboard Module

### Purpose
Quick view of performance metrics

### Endpoint
- `/api/admin/stats` → orders, revenue, top 5 dishes, hourly breakdown

### Future Add-ons
- Export reports
- Average service time (based on BellEvent ack latency)

---

## 🧭 Pagination & Sorting

All list endpoints support:

```
?page=0&size=20&sort=placedAt,desc
```

- Uses Spring `Pageable` abstraction
- Custom `parseSort()` handles malformed params

---

## ⚙️ Project Structure

```
src/
 ├─ main/java/com/quickmenu/
 │   ├─ auth/
 │   │   ├─ controller/AuthController.java
 │   │   ├─ model/User.java
 │   │   ├─ security/JwtTokenProvider.java
 │   │   └─ service/UserService.java
 │   ├─ menu/
 │   │   ├─ controller/RestaurantController.java
 │   │   ├─ controller/TableController.java
 │   │   ├─ controller/DishController.java
 │   │   ├─ service/MenuService.java
 │   │   └─ repo/MenuRepository.java
 │   ├─ orders/
 │   │   ├─ controller/OrderController.java
 │   │   ├─ model/Order.java
 │   │   └─ repo/OrderRepository.java
 │   ├─ bell/
 │   │   ├─ model/BellEvent.java
 │   │   ├─ controller/BellController.java
 │   │   ├─ controller/BellAdminController.java
 │   │   ├─ service/BellService.java
 │   │   └─ repo/BellEventRepository.java
 │   ├─ admin/
 │   │   ├─ controller/AdminStatsController.java
 │   │   └─ service/AdminStatsService.java
 │   ├─ config/
 │   │   ├─ SecurityConfig.java
 │   │   ├─ WebSocketConfig.java
 │   │   ├─ GlobalExceptionHandler.java
 │   │   └─ application.yml
 │   └─ QuickMenuApplication.java
 └─ resources/
     ├─ application.yml
     ├─ static/openapi.yaml
     └─ uploads/
```

---

## ⚖️ Tradeoffs & Interview Justifications

| Feature         | MVP Choice         | Why                          | Future Upgrade                          |
|----------------|--------------------|------------------------------|-----------------------------------------|
| Rate limiting   | In-memory map      | Quick, no infra dependency   | Redis TTL-based distributed limiter     |
| Realtime        | WebSocket (STOMP)  | Simple, low-latency          | Kafka → multi-instance scalability      |
| Auth            | JWT (stateless)    | Stateless & scalable         | Add refresh tokens / cookies            |
| File uploads    | Local              | Simpler dev/demo             | S3 / Cloudinary                         |
| DB              | H2/MySQL           | Lightweight for demo         | External MySQL/Postgres                 |
| Docs            | Static Swagger YAML| Clear fixed spec             | Generate from code via springdoc        |
| Tests           | Manual (Postman)   | Faster iteration             | JUnit + MockMvc later                   |

---

## 🔧 Quickstart (Local)
1. Clone:
   ```bash
   git clone <repo-url>
   cd quick-menu/backend
    ```
## Configure (optional)

```src/main/resources/application.yml```

- spring.datasource.* (H2 is default for dev)
- app.uploads-dir, app.base-url
- app.bell.cooldown-seconds (default 20s)

## Build & run

```bash
   ./mvnw clean package
   ./mvnw spring-boot:run
```

## Open

- API docs (Swagger UI): http://localhost:8080/swagger-ui/index.html
- Static OpenAPI (if used): http://localhost:8080/openapi.yaml
- Postman collection: docs/Quick-Menu.postman_collection.json
- Postman env: docs/Quick-Menu.postman_environment.json


---

## 🧹 Demo Data Persistence & Soft Delete

To maintain a consistent demo state for recruiters and users:
- **Soft Delete**: Deletions for demo data (`isDemo=true`) are "soft" (marked with `deletedAt`). Non-demo data is hard-deleted.
- **Auto-Restoration**: A scheduler runs every 30 minutes (configurable via `DEMO_DATA_RESTORE_INTERVAL_MINUTES`) to:
  - Restore soft-deleted demo entities.
  - Reset passwords for demo users (`admin@quickmenu.local`, `staff@quickmenu.local`).
- **Manual Trigger**: Admin can trigger restoration via `POST /api/admin/restore-demo-data`.

See `.env.example` for configuration.
