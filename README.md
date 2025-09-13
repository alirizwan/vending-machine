# Vending Machine Monorepo

A demonstration of a microservice-style backend for a vending machine system, built with **TypeScript**, **Express**, and **pnpm workspaces**.  
It contains three services:

- **vending-machine** → Manages beverages, ingredients, recipes, and preparation logic.  
- **auth** → Issues JWTs for technicians and vending machines (mock, no DB).  
- **payment** → Mock payment processor to demonstrate microservice communication.  

This project is designed for learning, prototyping, and showcasing **microservices, TypeScript, Prisma, and JWT auth**.

---

## Architecture

```
apps/
  vending-machine/   # Vending machine API (Prisma + SQLite)
  auth/              # Authentication mock (JWT)
  payment/           # Payment mock (in-memory)
infra/
  docker/            # Optional docker-compose for running services
```

- **Monorepo** managed with `pnpm`  
- **Services** run independently, communicate over HTTP  
- **JWT auth** ensures:  
  - **Machines** are identified via API keys  
  - **Technicians** authenticate with username/password  
- **Prisma + SQLite** used for vending-machine persistence  
- **Mocks**: Auth and Payment services are mocked for simplicity  

---

## Getting Started

### Prerequisites
- Node.js ≥ 20  
- pnpm ≥ 9  
- SQLite (bundled, no extra setup)  

### Install
```bash
pnpm install
```

### Prepare Vending Machine DB
```bash
pnpm -F @apps/vending-machine prisma generate
pnpm -F @apps/vending-machine prisma migrate dev --name init
pnpm -F @apps/vending-machine seed
```

### Run All Services Together
```bash
pnpm run dev:all
```

This starts:
- **Auth** → `http://localhost:7001`  
- **Payment** → `http://localhost:7002`  
- **Vending Machine** → `http://localhost:7000`  

---

## Authentication Service (`apps/auth`)

A mock service with **hardcoded technicians and machines**.

### Endpoints

#### Health
```http
GET /healthz
```

#### Technician login
```http
POST /auth/technician/login
Content-Type: application/json

{
  "username": "tech",
  "password": "tech123"
}
```
Response:
```json
{ "token": "<jwt>" }
```

#### Machine login
```http
POST /auth/machine/login
Content-Type: application/json

{
  "machineId": "vm-001",
  "apiKey": "vm-001-DEV-KEY"
}
```
Response:
```json
{ "token": "<jwt>" }
```

### Example JWT payloads

Technician:
```json
{
  "sub": "1",
  "role": "technician",
  "username": "tech",
  "iat": 123456,
  "exp": 123789
}
```

Machine:
```json
{
  "sub": "1",
  "role": "machine",
  "machineId": "vm-001",
  "iat": 123456,
  "exp": 123789
}
```

---

## Payment Service (`apps/payment`)

A mocked payment processor.

### Endpoints

#### Health
```http
GET /healthz
```

#### Create payment
```http
POST /payments
Content-Type: application/json

{
  "amountCents": 350,
  "currency": "EUR",
  "method": "mock",
  "machineId": "vm-001"
}
```

Response (201):
```json
{
  "id": "uuid",
  "amountCents": 350,
  "currency": "EUR",
  "method": "mock",
  "status": "succeeded",
  "machineId": "vm-001",
  "createdAt": "2025-09-12T10:00:00.000Z"
}
```

#### Idempotency
Use the `Idempotency-Key` header:
```bash
curl -X POST http://localhost:7002/payments   -H 'Content-Type: application/json'   -H 'Idempotency-Key: abc123'   -d '{"amountCents": 350}'
```

#### Simulate decline
```http
POST /payments?simulate=decline
```
Response: status `402` with `"status": "declined"`

---

## Vending Machine Service (`apps/vending-machine`)

Handles beverages, recipes, and preparation.

### Public Endpoints

#### List beverages
```http
GET /beverages
```
Response:
```json
[
  {
    "id": 1,
    "name": "Espresso",
    "price": 200,
    "recipe": [{ "ingredient": "espresso", "quantity": 1, "unit": "shot" }],
    "available": true,
    "shortages": []
  },
  {
    "id": 2,
    "name": "Cappuccino",
    "price": 300,
    "recipe": [
      { "ingredient": "espresso", "quantity": 1, "unit": "shot" },
      { "ingredient": "milk", "quantity": 150, "unit": "ml" }
    ],
    "available": false,
    "shortages": [
      { "ingredientId": 2, "ingredient": "milk", "required": 150, "available": 40, "unit": "ml" }
    ]
  }
]
```

#### Get beverage by id
```http
GET /beverages/1
```

### Machine Endpoint

#### Prepare beverage
```http
POST /beverages/:id/prepare
Authorization: Bearer <machine-token>
```
Response:
```json
{
  "beverageId": 1,
  "beverageName": "Espresso",
  "consumed": [{ "ingredientId": 1, "ingredient": "espresso", "quantity": 1, "unit": "shot" }]
}
```

### Technician Endpoints (private)

Require `Authorization: Bearer <technician-token>`.

#### List ingredients
```http
GET /ingredients
Authorization: Bearer <technician-token>
```

#### Adjust ingredients
```http
PATCH /ingredients
Authorization: Bearer <technician-token>
Content-Type: application/json

{
  "changes": [
    { "id": 1, "op": "increment", "amount": 100 },
    { "id": 2, "op": "set", "amount": 500 }
  ]
}
```

Response:
```json
[
  { "id": 1, "name": "espresso", "stockUnits": 1100 },
  { "id": 2, "name": "milk", "stockUnits": 500 }
]
```

---

## Flow Examples

### 1) Customer buys a drink
1. Vending machine frontend calls **Payment Service** → `/payments`
2. If payment succeeded:
   - Vending machine backend calls **Vending Machine Service** → `/beverages/:id/prepare` with machine JWT
   - Machine dispenses drink

### 2) Technician restocks machine
1. Technician logs in to **Auth Service** → gets token
2. Calls **Vending Machine Service** → `PATCH /ingredients` with token
3. Stock updated, drinks become available again

---

## Testing the system

1. **Get a technician token**
   ```bash
   curl -X POST http://localhost:7001/auth/technician/login      -H 'Content-Type: application/json'      -d '{"username":"tech","password":"tech123"}'
   ```

2. **Get a machine token**
   ```bash
   curl -X POST http://localhost:7001/auth/machine/login      -H 'Content-Type: application/json'      -d '{"machineId":"vm-001","apiKey":"vm-001-DEV-KEY"}'
   ```

3. **List beverages (public)**
   ```bash
   curl http://localhost:7000/beverages
   ```

4. **Prepare beverage (machine)**
   ```bash
   curl -X POST http://localhost:7000/beverages/1/prepare      -H "Authorization: Bearer <machine-token>"
   ```

5. **List ingredients (technician)**
   ```bash
   curl http://localhost:7000/ingredients      -H "Authorization: Bearer <technician-token>"
   ```

6. **Adjust ingredients (technician)**
   ```bash
   curl -X PATCH http://localhost:7000/ingredients      -H "Authorization: Bearer <technician-token>"      -H "Content-Type: application/json"      -d '{"changes":[{"id":2,"op":"increment","amount":200}]}'
   ```

---
