# QuickMenu Database Schema

## Entity Relationship Diagram

```mermaid
erDiagram
    users {
        varchar(36) id PK
        varchar name
        varchar email UK
        varchar password_hash
        enum role
        timestamp created_at
        boolean account_enabled
        varchar assigned_restaurant_id
        boolean is_demo
        timestamp deleted_at
    }

    user_restaurants {
        varchar(36) user_id FK
        varchar restaurant_id
    }

    restaurants {
        varchar(36) id PK
        varchar name
        varchar timezone
        varchar currency
        varchar address
        varchar owner_user_id
        varchar description
        varchar plan_id
        varchar banner_url
        timestamp created_at
        boolean is_demo
        timestamp deleted_at
    }

    restaurant_tables {
        varchar(36) id PK
        varchar restaurant_id FK
        varchar name
        varchar(1024) qr_url
        timestamp created_at
        boolean occupied
        boolean is_demo
        timestamp deleted_at
    }

    categories {
        varchar(36) id PK
        varchar restaurant_id FK
        varchar name
        integer order_index
        timestamp created_at
        boolean is_demo
        timestamp deleted_at
    }

    dishes {
        varchar(36) id PK
        varchar restaurant_id FK
        varchar category_id FK
        varchar name
        varchar(2000) description
        decimal price
        varchar image_url
        boolean is_available
        integer prep_time_mins
        varchar tags
        timestamp created_at
        boolean is_demo
        timestamp deleted_at
    }

    orders {
        varchar(36) id PK
        varchar restaurant_id FK
        varchar table_id FK
        varchar customer_name
        varchar customer_phone
        varchar(2000) customer_note
        enum status
        decimal total_amount
        timestamp placed_at
        boolean is_demo
        timestamp deleted_at
    }

    order_items {
        varchar(36) id PK
        varchar(36) order_id FK
        varchar(36) dish_id FK
        integer quantity
        decimal price_at_order
        varchar dish_name
        varchar(1000) note
    }

    bell_events {
        varchar(36) id PK
        varchar restaurant_id FK
        varchar table_id FK
        varchar(2000) message
        varchar source
        enum status
        timestamp created_at
        varchar ack_by
        timestamp ack_at
        boolean delivered
        integer attempts
    }

    users ||--o{ user_restaurants : "has many"
    restaurants ||--o{ restaurant_tables : "has many"
    restaurants ||--o{ categories : "has many"
    restaurants ||--o{ dishes : "has many"
    restaurants ||--o{ orders : "has many"
    restaurants ||--o{ bell_events : "has many"
    categories ||--o{ dishes : "contains"
    orders ||--o{ order_items : "contains"
    dishes ||--o{ order_items : "referenced by"
    restaurant_tables ||--o{ orders : "receives"
    restaurant_tables ||--o{ bell_events : "triggers"
```

## Tables Overview

| Table | Purpose |
|-------|---------|
| `users` | Admin, Staff, Customer accounts |
| `restaurants` | Restaurant profiles owned by admins |
| `restaurant_tables` | Physical tables with QR codes |
| `categories` | Menu categories (Starters, Mains, etc.) |
| `dishes` | Menu items with prices |
| `orders` | Customer orders |
| `order_items` | Line items linking orders ↔ dishes |
| `bell_events` | "Call Waiter" button events |

## Foreign Key Relationships

| Parent | Child | FK Column |
|--------|-------|-----------|
| `users` | `user_restaurants` | `user_id` |
| `restaurants` | `restaurant_tables` | `restaurant_id` |
| `restaurants` | `categories` | `restaurant_id` |
| `restaurants` | `dishes` | `restaurant_id` |
| `restaurants` | `orders` | `restaurant_id` |
| `categories` | `dishes` | `category_id` |
| `orders` | `order_items` | `order_id` ✔ |
| `dishes` | `order_items` | `dish_id` ✔ |

## Enums

### `Role` (users.role)
- `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_CUSTOMER`

### `Order.Status` (orders.status)
- `PLACED`, `PENDING`, `IN_PROGRESS`, `PREPARING`, `READY`, `SERVED`, `CANCELLED`

### `BellEvent.Status` (bell_events.status)
- `PENDING`, `ACKED`, `TIMEOUT`

## Soft Deletes

All major entities use `deleted_at` column with `@Where(clause = "deleted_at IS NULL")` for soft delete filtering.

## Demo Data

All entities have `is_demo` boolean for identifying seed data.
