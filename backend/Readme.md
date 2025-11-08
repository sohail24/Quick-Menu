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

## 🧰 Tech Stack
- Java 21, Spring Boot 3.x
- Spring Security (JWT)
- Spring WebSocket (STOMP / SockJS)
- Spring Data JPA (H2 / Postgres / MySQL)
- Swagger / OpenAPI (static + springdoc support)
- Postman collection + environment
- (Optional) Kafka / Redis — planned for scale

## Overview

| Layer                 | Technology                            | Notes                                      |
| --------------------- | ------------------------------------- | ------------------------------------------ |
| 🧩 Framework          | **Spring Boot 3.5.x**                 | Core framework for backend REST API        |
| 🔐 Security           | **Spring Security + JWT**             | Token-based auth, stateless API            |
| 💾 Database           | **H2 / MySQL (configurable)**         | JPA/Hibernate ORM                          |
| 🗄️ ORM               | **Spring Data JPA**                   | Simplifies DB operations                   |
| 🔔 Real-time          | **Spring WebSocket + STOMP**          | Live order and bell notifications          |
| 📦 Messaging (future) | **Kafka (planned)**                   | For async inter-service events             |
| 💬 Rate Limiting      | **In-memory map (MVP)** → Redis later | Prevent bell spam                          |
| 🖼️ File Upload       | **Multipart / Static Serving**        | Local uploads, can switch to S3/Cloudinary |
| 🧾 Docs               | **Swagger (OpenAPI 3)**               | Auto API documentation                     |
| 🧪 Testing Tool       | **Postman**                           | Collection + environment for all endpoints |
| 🧠 Language           | **Java 21**                           | Modern features, records, pattern matching |
| 🧰 Build Tool         | **Maven**                             | Dependency and build management            |


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

## 🔎 Major Endpoints (examples)

- ```POST /api/auth/signup — register & return token```

- ``` POST /api/auth/login — login & return token```

- ``` GET /api/{restaurantId}/menu — public menu (customer)```

- ``` POST /api/{restaurantId}/orders — place order```

- ``` POST /api/restaurants/{restaurantId}/tables/{tableId}/bell — ring bell (public)```

- ``` GET /api/{restaurantId}/bells — staff list bell events```

- ``` PATCH /api/{restaurantId}/bells/{bellId}/ack — staff ack bell```

- ``` POST /api/uploads — multipart image upload```

- ``` GET /api/admin/metrics — top dishes & hourly breakdown```


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
