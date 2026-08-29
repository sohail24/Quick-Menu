# QuickMenu — Distributed Microservices Architecture

QuickMenu is an interview-ready, high-performance restaurant ordering and notification system transformed from a monolith into an **Event-Driven Distributed Microservices Architecture**.

---

## 🏗️ System Architecture

```
                      ┌──────────────────────────────────────────────────┐
                      │      API Gateway (Spring Cloud Gateway) :8080    │
                      │    Route /api/auth/**     → backend:8083         │
                      │    Route /api/*/orders/** → backend:8083         │
                      │    Route /api/.../bell    → bell-service:8085    │
                      │    Route /ws/**           → notification:8084    │
                      └──────────────────────────────────────────────────┘
                             │           │             │            │
                     ┌───────┘    ┌──────┘      ┌──────┘     ┌──────┘
                     ▼            ▼             ▼            ▼
              ┌────────────┐┌───────────┐ ┌───────────┐┌──────────────────┐
              │  Backend   ││Menu Svc   │ │ Bell Svc  ││Notification Svc  │
              │  Monolith  ││(in bkend) │ │  :8085    ││     :8084        │
              │   :8083    ││  :8083    │ │           ││                  │
              │            ││           │ │Ring bell  ││WebSocket (STOMP) │
              │Auth, Order,││Menu CRUD, │ │Check Redis││Listens to Rabbit │
              │Payment     ││Table mgmt │ │Pub Rabbit ││Pushes to browser │
              └─────┬──────┘└───────────┘ └────┬──────┘└──────────────────┘
                    │                          │
                    ▼                          ▼
              ┌─────────────────────────────────────────────────────────────┐
              │                  RabbitMQ (Message Broker)                  │
              │  Topic Exchange: quickmenu.events                           │
              │  - order.placed.cash → notification.orders.queue            │
              │  - order.placed.online → notification.orders.queue           │
              │  - bell.ring         → notification.bells.queue             │
              │  Dead Letter Queue: quickmenu.dlq (for failed messages)    │
              └─────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
                                      ┌───────────┐
                                      │   Redis   │
                                      │           │
                                      │ Blacklist │
                                      │ Cooldown  │
                                      └───────────┘
```

---

## 🚀 Microservices Overview

| Microservice | Port | Key Technologies | Design Patterns / Responsibilities |
|---|---|---|---|
| **`api-gateway`** | `8080` | Spring Cloud Gateway, Reactive Redis, JJWT | **API Gateway Pattern**, Edge Security, Reactive JWT Validation, Redis Blacklist Enforcement |
| **`backend`** | `8083` | Spring Boot 3, Spring Data JPA, PostgreSQL, RabbitMQ Producer | Core Domain (Auth, Orders, Payments, Menu), Producer Confirms |
| **`notification-service`** | `8084` | Spring Boot 3, Spring AMQP, WebSocket (STOMP) | **Event-Driven Architecture**, Asynchronous Message Consumption, STOMP Push |
| **`bell-service`** | `8085` | Spring Boot 3, Spring AMQP, Spring Data Redis | **Bounded Context Isolation**, Redis TTL Cooldown & Exponential Backoff Rate-Limiting |
| **`rabbitmq`** | `5672` / `15672` | RabbitMQ 3.13 Management | Topic Exchange (`quickmenu.events`), Dead Letter Exchange (`quickmenu.dlx`), Durable Queues |
| **`redis`** | `6379` | Redis 7 | Distributed State: JWT Revocation Blacklist (`jwt:blacklist:*`), Bell Cooldown Keys |
| **`db`** | `5432` | PostgreSQL 16 | Relational Persistence |

---

## ⚡ Quick Start

### Run Complete Stack with Docker Compose

```bash
# Build and launch all 7 microservices & infrastructure containers
docker compose up -d --build

# Inspect container status
docker compose ps
```

### Endpoints Overview

- **API Gateway Entry Point**: `http://localhost:8080`
- **RabbitMQ Management Console**: `http://localhost:15672` (User: `guest`, Pass: `guest`)
- **Backend Actuator / Health**: `http://localhost:8080/actuator/health`
- **Demo Info Endpoint**: `http://localhost:8080/api/demo/info`

---

## 🛠️ Verification & Test Scenarios

### 1. Stateless JWT Auth & Redis Blacklist
1. Sign up (`POST /api/auth/signup`) or Login (`POST /api/auth/login`) through Gateway on port `8080`.
2. Logout (`POST /api/auth/logout`) with `Authorization: Bearer <token>`.
3. Token is stored in Redis under `jwt:blacklist:<token>` with TTL equal to the remaining token lifetime.
4. Subsequent requests using the blacklisted token are intercepted by `JwtAuthGatewayFilter` in $O(1)$ time and rejected with **`401 Unauthorized`**.

### 2. Decoupled Asynchronous Order Processing
1. Customer submits order (`POST /api/{restaurantId}/orders`).
2. `backend` validates order, saves to Postgres, publishes `order.placed.cash` event to RabbitMQ, and returns HTTP `201 Created` immediately (<50ms response).
3. `notification-service` consumes event asynchronously from `notification.orders.queue` and delivers STOMP frame to `/topic/restaurants/{restaurantId}/orders`.

### 3. Standalone Bell Service & Redis Cooldown Rate Limiting
1. Customer calls waiter (`POST /api/restaurants/{restaurantId}/tables/{tableId}/bell`).
2. Gateway routes request directly to `bell-service` (port `8085`).
3. `bell-service` checks Redis for TTL key `bell:cooldown:{tableId}`.
4. If valid, publishes `bell.ring` event to RabbitMQ. Rapid spam attempts hit Redis TTL and return **`429 Too Many Requests`**.

### 4. Message Durability & Dead Letter Queue (DLQ)
1. Stop `notification-service` container (`docker compose stop notification-service`).
2. Place an order. Message is durably stored in RabbitMQ (`notification.orders.queue` count = 1).
3. Restart `notification-service`. Consumer automatically reconnects, drains queue, and pushes WebSocket notification.

---

## 🎯 Interview Talking Points

- **Q: Why decouple notifications from order placement?**
  *A: In the monolith, order placement synchronously pushed WebSockets. If 1,000 clients were connected or the WebSocket broker lagged, the HTTP order request would stall. By publishing events to RabbitMQ, HTTP responses return instantly while notifications are processed asynchronously.*

- **Q: Why RabbitMQ over Kafka?**
  *A: QuickMenu requires transactional task routing and topic exchanges (e.g. `order.placed`, `bell.ring`), not high-throughput log streaming. RabbitMQ's AMQP topic exchange and native Dead Letter Queue (DLQ) support fit perfectly.*

- **Q: How does the Gateway validate JWT logout statelessly?**
  *A: On logout, the JWT signature is added to Redis with a TTL equal to the token's remaining lifespan. Spring Cloud Gateway's reactive filter performs an $O(1)$ key check on every request, rejecting revoked tokens at the edge without calling downstream services.*
