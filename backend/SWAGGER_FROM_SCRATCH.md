# Swagger / OpenAPI (From Scratch) — Tail Waggers Backend

This guide explains **two different “flows”** in your backend:

1) **Real API flow (runtime)**: Browser/React → Express → middleware → route → MongoDB (Mongoose) → JSON response.
2) **Swagger flow (documentation-time)**: `@swagger` comments in code → `swagger-jsdoc` generates an OpenAPI JSON spec → Swagger UI renders it at `/api-docs`.

If you keep these two flows separate in your head, Swagger becomes easy.

---

## 1) What you are building (simple mental model)

### API
An **API** is just a set of URLs that your frontend can call.

Example:
- `GET http://localhost:5000/api/products` → asks the server for products
- `POST http://localhost:5000/api/messages/contact` → sends a message to the server

### Endpoint
An **endpoint** is one “method + path” pair.

Examples:
- `GET /api/messages/my-messages`
- `POST /api/messages/{id}/reply`

### Request vs Response
- **Request**: what the client sends (URL, method, headers, body)
- **Response**: what the server sends back (status code + JSON)

### JSON
**JSON** is a text format for data.

Example JSON request body:
```json
{
  "subject": "Need help",
  "message": "My order is delayed"
}
```

---

## 2) The real request flow in your backend (runtime)

The core runtime entry point is:
- `backend/server.js`

When a request comes in, Express runs things in this rough order:

1) **Global middleware** runs first (`helmet`, `compression`, `cors`, rate limiters, body parsers)
2) Express matches the request to a **mounted router** (like `/api/messages`)
3) Inside that router, Express matches the request to a **route handler** (like `router.post("/contact", ...)`)
4) Any route-specific middleware runs (example: `isAuthenticated`)
5) The handler talks to MongoDB via **Mongoose models** (example: `Message`)
6) The handler sends a JSON response with a status code

### Concrete example: `POST /api/messages/contact`
Relevant file:
- `backend/routes/messageRoutes.js`

Flow:
1) Client sends `POST /api/messages/contact` with JSON body.
2) In `server.js`, this router is mounted:
   - `app.use("/api/messages", require("./routes/messageRoutes"))`
3) Because `/api/messages` matched, Express looks inside `messageRoutes.js`.
4) It finds:
   - `router.post("/contact", isAuthenticated, async (req, res) => { ... })`
5) `isAuthenticated` checks the JWT token in the `Authorization` header.
6) If OK, handler creates a new `Message` document using the Mongoose model:
   - `const newMessage = new Message({ ... })`
7) It saves to MongoDB:
   - `await newMessage.save()`
8) It responds:
   - `res.status(201).json({ success: true, data: newMessage })`

Important: **Swagger is not involved in steps 1–8.** That is the real API execution.

---

## 3) What Swagger/OpenAPI is (and what it is not)

### OpenAPI
**OpenAPI** is a standard JSON/YAML format that describes:
- what endpoints exist
- what inputs they accept
- what responses they return
- what auth they require

### Swagger
“Swagger” is commonly used to mean:
- the OpenAPI spec, and/or
- the UI that displays it (Swagger UI)

### What Swagger is NOT
Swagger does not automatically secure your API.
Swagger does not automatically validate your input.
Swagger does not create endpoints.

Swagger is documentation (and an interactive testing UI) for endpoints you already wrote.

---

## 4) How Swagger is wired in *this* project

Two key files:

### A) `backend/config/swagger.js` (spec generation)
This file creates the OpenAPI spec using `swagger-jsdoc`.

Key parts (plain English):
- `openapi: "3.0.0"` → tells tools which OpenAPI version
- `info` → title/version/description
- `servers` → where your API runs (`http://localhost:5000`)
- `components.securitySchemes.bearerAuth` → defines JWT Bearer token auth
- `security: [{ bearerAuth: [] }]` → sets bearer auth as the default for endpoints
- `apis: ["./routes/*.js", "./models/*.js"]` → tells swagger-jsdoc where to scan for `@swagger` comment blocks

What `swagger-jsdoc` does:
- it reads those JS files
- it finds `/** ... */` blocks that contain `@swagger`
- it merges those blocks into one big OpenAPI JSON document (`swaggerSpec`)

### B) `backend/server.js` (Swagger UI hosting)
This is where the UI is served:
- `app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));`

Meaning:
- Visit `http://localhost:5000/api-docs` in your browser
- Swagger UI loads the `swaggerSpec` JSON
- Swagger UI renders endpoints + “Try it out” buttons

---

## 5) “How data travels” vs “how docs are generated” (side-by-side)

### Runtime (real API call)
Client → Express middleware → route handler → database → JSON response

### Docs generation (Swagger)
Your code comments (`@swagger`) → `swagger-jsdoc` builds JSON spec → Swagger UI shows it

Swagger UI calls your endpoints when you click “Try it out”, but the UI itself is just a client.

---

## 6) Explaining the common OpenAPI words you see in `@swagger` blocks

Below are the most common keys you’ll see and what each word means.

### `tags`
A way to group endpoints in the Swagger UI sidebar.

### `paths`
The dictionary of endpoints.

Example path item:
- `/api/messages/contact` → the URL path

### `get`, `post`, `patch`, `delete`, `put`
The HTTP methods.

### `summary`
One-line description of what the endpoint does.

### `security`
What authentication is required for this endpoint.

Example:
```yaml
security:
  - bearerAuth: []
```
Meaning: “You must include a JWT bearer token.”

### `parameters`
Inputs that are **not** in the request body.

Common places:
- `in: path` → like `{id}` in `/api/messages/{id}`
- `in: query` → like `?page=2`
- `in: header` → like `Authorization: Bearer ...`

### `requestBody`
The JSON body the client sends (mostly for `POST/PUT/PATCH`).

### `content` and `application/json`
Says the body is JSON.

### `schema`
Describes the shape (structure) of data.

### `type`
Data type:
- `string`, `number`, `integer`, `boolean`, `array`, `object`

### `properties`
The fields inside an object.

### `required`
Which fields must exist.

### `responses`
Possible server responses, keyed by HTTP status code.

Example:
- `200` OK
- `201` Created
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `500` Server Error

### `$ref`
A pointer to a reusable schema.

Example:
```yaml
$ref: '#/components/schemas/Message'
```
Meaning: “Use the schema named `Message` from `components.schemas`.”

---

## 7) Where the Swagger schemas live (models)

In this project, model files define reusable schemas under:
- `components.schemas`

Example:
- `backend/models/Message.js` defines `components.schemas.Message` (and helper schemas like `RelatedTo`, `ContactInfo`).

This is just documentation; your real database rules are defined by the Mongoose schema (`new mongoose.Schema({...})`).

---

## 8) Where the Swagger endpoints live (routes)

Route files contain `@swagger` blocks that describe endpoints under `/api/...`.

Rule of thumb in this repo:
- Route files (`backend/routes/*.js`) document **endpoints**
- Model files (`backend/models/*.js`) document **schemas**

---

## 9) Inventory: every backend file that contains `@swagger`

These are the files that `swagger-jsdoc` scans (because of `apis: ["./routes/*.js", "./models/*.js"]`) and that actually contain `@swagger` blocks.

### Models (schemas)
- `backend/models/AdoptionApplication.js`
- `backend/models/Appointment.js`
- `backend/models/Cart.js`
- `backend/models/Message.js`
- `backend/models/Notification.js`
- `backend/models/Order.js`
- `backend/models/Pet.js`
- `backend/models/Product.js`
- `backend/models/Revenue.js`
- `backend/models/Review.js`
- `backend/models/Transaction.js`
- `backend/models/User.js`

### Routes (endpoints)
- `backend/routes/adminRoutes.js`
- `backend/routes/appointmentRoutes.js`
- `backend/routes/authRoutes.js`
- `backend/routes/cartRoutes.js`
- `backend/routes/checkoutRoutes.js`
- `backend/routes/dashboardRoutes.js`
- `backend/routes/indexRoutes.js`
- `backend/routes/messageRoutes.js`
- `backend/routes/notificationRoutes.js`
- `backend/routes/orderRoutes.js`
- `backend/routes/petRoutes.js`
- `backend/routes/productRoutes.js`
- `backend/routes/revenueRoutes.js`

### Swagger wiring (does NOT contain `@swagger`, but controls the system)
- `backend/config/swagger.js` (generates spec)
- `backend/server.js` (serves Swagger UI at `/api-docs`)

---

## 10) How to use Swagger UI with JWT in this project

1) Start the backend (`backend/server.js`).
2) Open: `http://localhost:5000/api-docs`
3) Click **Authorize**.
4) Paste your token like:
   - `Bearer YOUR_JWT_TOKEN_HERE`

Because `backend/config/swagger.js` defines `bearerAuth`, endpoints that require auth can be tried directly in the UI.

---

## 11) Common mistakes (and how to avoid breaking the app)

### Mistake A: Putting Swagger comments inside code blocks
Keep `/** ... */` Swagger blocks **above** the route or schema section, not inside functions/try-catch blocks.

### Mistake B: Invalid YAML/indentation inside the comment
Inside `@swagger` blocks, indentation matters.

### Mistake C: Documenting a path that doesn’t match your Express mounting
Example:
- In `server.js`: `app.use("/api/messages", router)`
- In router file: `router.post("/contact", ...)`

So the final path is:
- `/api/messages/contact`

Your Swagger path should match the final mounted path.

---

## 12) Next step (recommended learning path)

To learn fastest, do this in order:

1) Read `backend/server.js` once to understand request routing.
2) Read `backend/config/swagger.js` once to understand doc generation.
3) Pick ONE feature (Messages is a good one):
   - routes: `backend/routes/messageRoutes.js`
   - schema: `backend/models/Message.js`
4) Only after that, scan other route/model files — they follow the same pattern.
