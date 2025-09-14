# ☕ Vending Machine Monorepo

This project is a **microservice-style vending machine system** built with:

- **Node.js / TypeScript**  
- **Express** (backend services)  
- **Prisma ORM** with SQLite (local DB, migrations supported)  
- **Next.js** (frontend web UI)  
- **pnpm** (monorepo package manager)  
- **Docker + Terraform** (for deployment, optional)

It demonstrates:
- Service separation (Auth, Payment, Vending Machine)
- Infrastructure-as-code mindset
- Authentication/authorization (machine API keys, technician login)
- A UI that simulates a real vending machine experience.

---

## 📦 Prerequisites

- **Node.js v18+**
- **pnpm** (install instructions below)
- **SQLite** (comes bundled, no separate install needed)

---

## ⚙️ Installing pnpm

If you don’t have pnpm installed:

```bash
npm install -g pnpm
```

Verify installation:

```bash
pnpm -v
```

---

## 🚀 Getting Started

### 1. Install dependencies

At the monorepo root:

```bash
pnpm install
```

### 2. Run database migrations

The **vending-machine service** uses Prisma with SQLite.

```bash
pnpm -F @apps/vending-machine prisma migrate dev
```

This will:
- Create the SQLite database at `apps/vending-machine/prisma/dev.db`
- Run the migrations
- Generate the Prisma client

### 3. Seed the database

```bash
pnpm -F @apps/vending-machine prisma db seed
```

Seeds initial beverages, recipes, and ingredient stock.

---

## ▶️ Running the services

You can run all three backend services + the frontend with one command:

```bash
pnpm dev
```

This launches:

- **Auth Service** → http://localhost:7001  
- **Payment Service** → http://localhost:7002  
- **Vending Machine Service** → http://localhost:7000  
- **Web App (Next.js)** → http://localhost:3000  

Each service also has its own `pnpm dev` if you want to run them individually:

```bash
pnpm -F @apps/auth dev
pnpm -F @apps/payment dev
pnpm -F @apps/vending-machine dev
pnpm -F @apps/web dev
```

---

## 🔑 Authentication

There are two types of authentication:

### 1. Technician login (username/password)

Hardcoded in the **Auth Service** for testing:

| Username | Password   | Role        |
|----------|------------|-------------|
| `tech`   | `tech123`  | Technician  |
| `admin`  | `admin123` | Technician  |

### 2. Machine authorization (API key)

Machines identify with **machineId + apiKey**. Hardcoded in **Auth Service**:

| Machine ID | API Key         |
|------------|-----------------|
| `vm-001`   | `vm-001-DEV-KEY`|
| `vm-002`   | `vm-002-DEV-KEY`|

---

## 🖥️ Web UI Flow

Start at: http://localhost:3000

### Step 1: Technician login
- Go to `/` (root page).
- Enter credentials (e.g., `tech` / `tech123`).
- After login you’re recognized as a **Technician**.

### Step 2: Authorize a machine
- Go to `/machine`.
- Provide:
  - `machineId` (e.g., `vm-001`)
  - `apiKey` (e.g., `vm-001-DEV-KEY`)
- Once authorized, this simulates a **specific vending machine instance**.

### Step 3: Order a beverage
- Go to `/beverages`.
- Browse list of beverages with recipe & stock availability.
- Click **Prepare** on an available beverage.
- A dialog asks:
  - **Espresso shots** (≥ base recipe requirement)
  - **Sugar grams** (can be 0, adds sugar if not part of recipe)
  - Optionally **simulate declined payment**
- After confirming:
  1. The UI shows **“Please pay on the terminal next to the machine”** (simulated 2s delay).
  2. Calls the **Payment Service**.
  3. Simulates brewing time (3s).
  4. Calls the **Vending Machine Service** to decrement stock.
  5. Shows success or shortage error.

### Step 4: Maintenance
- Go to `/maintenance`.
- As a logged-in Technician, you can:
  - View current ingredient stock.
  - Increment/decrement/set stock quantities.
  - Apply changes to refill or adjust machine.

---

## 🔍 Example API calls

### Vending Machine Service
- `GET /beverages` → list all beverages with recipe & availability.
- `POST /beverages/:id/prepare` → simulate preparing beverage (requires machine token).
- `GET /ingredients` → list ingredients (requires technician token).
- `PATCH /ingredients` → adjust stock (requires technician token).

### Auth Service
- `POST /auth/technician/login` → { username, password } → returns JWT
- `POST /auth/machine/login` → { machineId, apiKey } → returns JWT

### Payment Service
- `POST /payments` → { amountCents, method, machineId } → returns confirmation or decline.

---

## 🛠️ Tech Decisions

- **Monorepo with pnpm workspaces** → Easy dependency sharing across services.
- **Express** → Simple and well-known web framework.
- **Prisma + SQLite** → Developer-friendly ORM with migrations & local DB.
- **Next.js** → Full-featured React framework for client app.
- **Auth mocking** → Hardcoded users and machines for demo purposes.
- **Payment mocking** → Fake service to demonstrate microservice integration.
- **CORS configured** for dev between `localhost:3000` and backend services.

---

## 🧪 Testing

- Run services with `pnpm dev`.
- Open http://localhost:3000 in your browser.
- Follow the UI flow (login → authorize machine → order beverage → maintenance).
- Check backend logs for request traces.

---

## 📂 Project Structure

```
.
├── apps
│   ├── auth             # Authentication service
│   ├── payment          # Payment mock service
│   ├── vending-machine  # Vending Machine service (Prisma, DB)
│   └── web              # Next.js frontend
├── package.json         # Root scripts (pnpm dev, lint, etc.)
├── pnpm-workspace.yaml  # Monorepo config
└── README.md            # This file
```
