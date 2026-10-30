# Shop Billing System

A small, full-stack shop billing application built with React and Spring Boot. Product information is served by the REST API from MySQL; the React app does not contain a hardcoded product catalogue. Bills are calculated in the browser for the workflow and are printable as a clean receipt. Bills are not persisted.

## Features

- Loads inventory using `GET /api/products` from Spring Data JPA/MySQL.
- Customer name required; current date shown on the bill.
- Add/remove products, set positive whole-number quantities, and see live line totals.
- Automatic subtotal and exact rule: 10% discount only when subtotal is **greater than** ₹1,000. Exactly ₹1,000 receives no discount.
- Generate, review, print only the receipt, and start a new bill.
- Responsive UI, loading/error states, and retry when the API is unavailable.

## Technologies and structure

- Frontend: React, Vite, JavaScript, CSS
- Backend: Java 17+, Spring Boot, Spring Web, Spring Data JPA, Hibernate, Maven
- Database: MySQL, MySQL Connector/J

```text
backend/
  pom.xml
  src/main/java/com/shopbilling/
    ShopBillingApplication.java
    controller/ProductController.java
    entity/Product.java
    repository/ProductRepository.java
  src/main/resources/{application.properties,data.sql}
frontend/
  index.html  package.json  vite.config.js
  src/{main.jsx,App.jsx,App.css}
```

## Prerequisites

- Java 17 or newer and Maven 3.6+
- MySQL 8+ running locally
- Node.js 18+ and npm

## Database and credentials

Create the schema in MySQL:

```sql
CREATE DATABASE shop_billing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

The backend connects to `jdbc:mysql://localhost:3306/shop_billing`. Configure credentials using environment variables; defaults are username `root` and empty password for a local development installation. Do not commit real credentials.

Linux/macOS, for example:

```bash
export DB_USERNAME=root
export DB_PASSWORD='your-mysql-password'
# Optional override:
# export DB_URL='jdbc:mysql://localhost:3306/shop_billing?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC'
```

PowerShell:

```powershell
$env:DB_USERNAME = 'root'
$env:DB_PASSWORD = 'your-mysql-password'
```

Hibernate creates/updates the `products` table and `data.sql` inserts ten sample products if absent on startup. The database must be created first and the configured MySQL account must have permission to create/alter tables and insert rows.

## Run the application

Open two terminals from the repository root.

Terminal 1 — backend:

```bash
cd backend
mvn spring-boot:run
```

Backend listens on http://localhost:8080.

Terminal 2 — frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally http://localhost:5173. Vite proxies `/api` requests to Spring Boot. To use a backend on another address set `BACKEND_URL` before starting Vite, e.g. `BACKEND_URL=http://localhost:8080 npm run dev` (PowerShell: `$env:BACKEND_URL='http://localhost:8080'; npm run dev`).

## API

`GET http://localhost:8080/api/products` returns an array of product records, for example:

```json
[{"id":1,"name":"Rice","price":60.00}]
```

The API returns HTTP 200 for a successful listing. A database connection error prevents the backend from starting; the frontend reports the API/database issue and offers retry. CORS permits the local Vite origins.

## Calculation/validation

Item total = product database price × quantity. Subtotal is the sum of line totals. Discount is subtotal × 10% only if subtotal > 1000, otherwise zero. Final amount is subtotal minus discount. Customer name and at least one item are required to generate. Quantity must be a positive integer. Use the **Print bill** button after generating; the browser print stylesheet excludes all entry controls and prints just the receipt. The browser's own print dialog is required.

## Troubleshooting

- **Cannot connect / empty products:** confirm MySQL is running, `shop_billing` exists, credentials are correct, then check backend logs and retry in the app.
- **Access denied:** grant the configured MySQL user access to `shop_billing` and set `DB_USERNAME` / `DB_PASSWORD` in the backend terminal environment.
- **Port already in use:** set `PORT=8081` for Spring and `BACKEND_URL=http://localhost:8081` for Vite.
- **Frontend cannot fetch API:** run both servers; Vite's `/api` proxy targets port 8080 by default.
- **Print includes unexpected browser headers:** disable headers/footers in the browser print dialog; application controls are hidden by print CSS.

## Build checks

```bash
cd frontend && npm run build
cd ../backend && mvn test
```
