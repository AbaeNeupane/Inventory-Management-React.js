# Smart Inventory — Django Backend

Complete REST API for Smart Inventory & POS.
Built with **Django 5**, **Django REST Framework**, **SimpleJWT**, and **SQLite** (default).

---

## Quick Start (Windows)

### 1. Create and activate a virtual environment

```cmd
python -m venv .venv
.venv\Scripts\activate
```

### 2. Install dependencies

```cmd
pip install -r requirements.txt
```

### 3. Create your `.env` file

```cmd
copy .env.example .env
```

That's it — no database to install. SQLite is built into Python and Django
will create `db.sqlite3` automatically on first run.

### 4. Run migrations

```cmd
python manage.py makemigrations accounts
python manage.py makemigrations products
python manage.py makemigrations inventory
python manage.py makemigrations customers
python manage.py makemigrations suppliers
python manage.py makemigrations sales
python manage.py makemigrations settings_app
python manage.py migrate
```

### 5. Seed demo data

```cmd
python manage.py seed
```

This creates demo users, products, customers, suppliers and 20 sample orders.

```
Superuser:  admin@example.com    / admin1234
Manager:    manager@example.com  / manager1234
Cashier:    cashier@example.com  / cashier1234
```

### 6. Start the server

```cmd
python manage.py runserver
```

---

## URLs

| URL | Description |
|-----|-------------|
| `http://localhost:8000/api/v1/docs/` | Swagger UI — all endpoints, interactive |
| `http://localhost:8000/api/v1/redoc/` | ReDoc documentation |
| `http://localhost:8000/admin/` | Django admin panel |

---

## Project Structure

```
backend/
├── config/                     # Django project config
│   ├── settings.py             # SQLite by default, optional PostgreSQL
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── accounts/               # Custom user model, JWT auth, roles
│   ├── products/               # Products, categories, brands
│   ├── inventory/              # Stock adjustments, audit log
│   ├── customers/              # Customer profiles, loyalty tiers
│   ├── suppliers/              # Suppliers, purchase orders
│   ├── sales/                  # POS orders, line items, refunds
│   ├── reports/                # Analytics & reporting endpoints
│   └── settings_app/           # Company profile, tax, notifications
├── manage.py
├── requirements.txt
└── .env.example
```

---

## Database

**SQLite** is the default — zero setup, zero installation.
Django creates `db.sqlite3` in the project root automatically.

To switch to PostgreSQL later (optional):
1. Install PostgreSQL
2. Install `psycopg2-binary`: `pip install psycopg2-binary`
3. Set in `.env`:
```
USE_POSTGRES=True
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
```

---

## Authentication

All endpoints except `/api/v1/auth/login/` require a Bearer JWT token.

### Login
```http
POST /api/v1/auth/login/
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin1234"
}
```

Response includes `access`, `refresh`, and `user` object.

### Use the token
```
Authorization: Bearer <access_token>
```

---

## API Endpoints Summary

### Auth — `/api/v1/auth/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `login/` | Get JWT tokens |
| POST | `logout/` | Blacklist refresh token |
| POST | `token/refresh/` | Refresh access token |
| GET/PATCH | `me/` | Current user profile |
| POST | `change-password/` | Change own password |
| GET/POST | `users/` | List / invite users (Owner) |
| PATCH/DELETE | `users/{id}/` | Edit / remove user (Owner) |
| POST | `users/{id}/reset-password/` | Reset user password (Owner) |

### Products — `/api/v1/products/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/` | List / create products |
| GET/PATCH/DELETE | `{id}/` | Detail / update / delete |
| GET | `low-stock/` | Products at reorder level |
| POST | `{id}/adjust-stock/` | Manual stock delta |
| GET/POST | `categories/` | List / create categories |
| GET/POST | `brands/` | List / create brands |

### Inventory — `/api/v1/inventory/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `summary/` | Stock KPI snapshot |
| GET | `low-stock/` | Products below reorder level |
| GET/POST | `adjustments/` | Stock adjustment log / add entry |

### Customers — `/api/v1/customers/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/` | List / create customers |
| GET/PATCH/DELETE | `{id}/` | Detail / update / delete |
| GET | `{id}/orders/` | Purchase history |
| POST | `{id}/recalculate-tier/` | Refresh loyalty tier |

### Suppliers — `/api/v1/suppliers/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/` | List / create suppliers |
| GET/PATCH/DELETE | `{id}/` | Detail / update / delete |
| GET/POST | `purchase-orders/` | List / create purchase orders |
| POST | `purchase-orders/{id}/receive/` | Receive PO (adds stock) |
| POST | `purchase-orders/{id}/cancel/` | Cancel PO |

### Sales — `/api/v1/sales/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `orders/` | List all / create POS sale |
| GET | `orders/{id}/` | Order detail with line items |
| POST | `orders/{id}/refund/` | Refund (restores stock) |

### Reports — `/api/v1/reports/`
All accept `?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD`

| Endpoint | Description |
|----------|-------------|
| `dashboard/` | Today + month KPIs, inventory snapshot |
| `sales-summary/` | Revenue, orders, avg order, tax |
| `sales-by-period/` | Revenue by day / week / month |
| `top-products/` | Best sellers by revenue |
| `payment-methods/` | Revenue split by payment method |
| `inventory-valuation/` | Stock value and margin per product |
| `customer-analytics/` | Tier distribution, top spenders |

### Settings — `/api/v1/settings/`
| Endpoint | Description |
|----------|-------------|
| `company/` | Company profile (Owner: PATCH) |
| `tax/` | Tax configuration (Owner: PATCH) |
| `notifications/` | Notification preferences (Owner: PATCH) |

---

## User Roles

| Role | Capabilities |
|------|-------------|
| Owner | Full access — settings, user management, everything |
| Manager | All operations except user management and settings |
| Cashier | Create sales, read products / inventory / customers |

---

## Connecting to the React Frontend

In the React project root, create `.env`:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Run both servers simultaneously:
```cmd
# Terminal 1 — Django backend
cd backend
.venv\Scripts\activate
python manage.py runserver

# Terminal 2 — React frontend
cd inventory-saas
npm install
npm run dev
```

Open `http://localhost:5173` — the login page will appear and connect to the backend automatically.
