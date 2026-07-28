# Orbit CRM - API Documentation & Test Credentials

This document provides a comprehensive list of all the API endpoints available in the Orbit CRM backend, their required permissions, and the default test credentials to log in.

## 🔐 Test Login Credentials

The database is seeded with 4 default users, one for each role in the system.

| Role | Email | Password | Allowed Actions (Examples) |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@erp.com` | `password123` | Full access to all endpoints. |
| **Sales** | `sales@erp.com` | `password123` | Create/Edit Customers, Create/Confirm Challans. |
| **Warehouse** | `warehouse@erp.com` | `password123` | Create/Edit Products, Upload Images, Update Stock. |
| **Accounts** | `accounts@erp.com` | `password123` | Read-only access to most endpoints (No creation/editing). |

---

## 🚀 API Endpoints

All endpoints (except `/auth/login`) require a Bearer token in the `Authorization` header:
`Authorization: Bearer <your_jwt_token>`

### 1. Authentication
*   **`POST /auth/login`**
    *   **Description:** Authenticates a user and returns a JWT token.
    *   **Body:** `{ "email": "admin@erp.com", "password": "password123" }`
    *   **Access:** Public

### 2. Customers Module
*   **`GET /customers`**
    *   **Description:** Fetch all customers. Supports search and pagination (`?search=query&page=1&limit=10`).
    *   **Access:** All authenticated users.
*   **`POST /customers`**
    *   **Description:** Create a new customer.
    *   **Access:** `ADMIN`, `SALES`
*   **`GET /customers/:id`**
    *   **Description:** Fetch a specific customer by ID, including their challans.
    *   **Access:** All authenticated users.
*   **`PUT /customers/:id`**
    *   **Description:** Update an existing customer's details.
    *   **Access:** `ADMIN`, `SALES`
*   **`PUT /customers/:id/notes`**
    *   **Description:** Append a note and update the follow-up date for a customer.
    *   **Access:** `ADMIN`, `SALES`

### 3. Products & Inventory Module
*   **`GET /products`**
    *   **Description:** Fetch all products. Supports search and pagination.
    *   **Access:** All authenticated users.
*   **`POST /products`**
    *   **Description:** Add a new product to the inventory.
    *   **Access:** `ADMIN`, `WAREHOUSE`
*   **`PUT /products/:id`**
    *   **Description:** Update a product's details (name, price, SKU).
    *   **Access:** `ADMIN`, `WAREHOUSE`
*   **`POST /products/:id/image`**
    *   **Description:** Upload an image for a specific product. (Expects `multipart/form-data` with an `image` file).
    *   **Access:** `ADMIN`, `WAREHOUSE`
*   **`PUT /products/:id/stock`**
    *   **Description:** Manually adjust the stock of a product (creates a movement log).
    *   **Access:** `ADMIN`, `WAREHOUSE`
*   **`GET /movements`**
    *   **Description:** Fetch the history of all stock movements (IN/OUT logs).
    *   **Access:** All authenticated users.

### 4. Sales Challans Module
*   **`GET /challans`**
    *   **Description:** Fetch all sales challans, including customer and item details.
    *   **Access:** All authenticated users.
*   **`POST /challans`**
    *   **Description:** Create a new sales challan (saved as `DRAFT` by default). Captures a snapshot of the product prices at the time of creation.
    *   **Access:** `ADMIN`, `SALES`
*   **`PUT /challans/:id/confirm`**
    *   **Description:** Confirms a draft challan. **Automatically deducts product stock** and generates an `OUT` stock movement log. Will fail if stock is insufficient.
    *   **Access:** `ADMIN`, `SALES`
