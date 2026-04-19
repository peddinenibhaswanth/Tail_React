# Performance & DB Optimization Report (Template)

Use this file during end-review to prove you did DB optimization + Redis caching and to show measurable improvements.

> Keep screenshots / command output in `backend/test-reports/benchmarks/` (or attach in your final report submission).

---

## 1) Environment

- Date: 2026-04-18
- Machine: (CPU/RAM)
- OS: Windows
- Node version: v25.2.1
- MongoDB: local Docker `mongo:6`
- Redis: local Docker `redis:7-alpine`

### Backend config

- `MONGODB_URI`:
- `REDIS_ENABLED`:
- `REDIS_URL`:

---

## 2) DB Optimization (MongoDB)

### 2.1 Slow areas you identified

List the endpoints/queries that were slow and why.

- Endpoint: `GET /api/products`
  - Bottlenecks addressed:
    - Filtering now uses normalized equality on `category` and `petType` (instead of regex), allowing MongoDB to use compound indexes.
    - Response generation uses `.lean()` to avoid Mongoose document hydration overhead for list endpoints.
- Endpoint: `GET /api/appointments/veterinaries`
  - Bottlenecks addressed:
    - Listing query uses `.lean()` and a compound index on `{ role, isApproved }`.

Example format:
- Endpoint: `GET /api/products`
  - Suspected bottleneck: text search + sorting + pagination
  - Evidence: response time, CPU usage, MongoDB explain plan

### 2.2 Indexes implemented

List the important indexes and what queries they help.

- Collection: `products`
  - Index: `{ name: "text", description: "text" }`
  - Helps: `search` queries (MongoDB `$text`)
  - Index: `{ category: 1, petType: 1, price: 1 }`
  - Helps: filtered listings like `category=<...>&petType=<...>` with price sorting

- Collection: `users`
  - Index: `{ role: 1, isApproved: 1 }`
  - Helps: listing approved users by role (veterinaries/sellers)

Example format:
- Collection: `products`
  - Index: `{ name: "text", description: "text" }`
  - Helps: keyword search

### 2.3 Query planning evidence

For at least 1–2 queries, include `explain()` output.

- Query 1:
  - Endpoint pattern: products listing with indexed filters and price sort
  - Command:
    - `docker exec project_with_react-mongo-1 mongosh --quiet --eval "const db2=db.getSiblingDB('tail-treasures'); const e=db2.products.find({category:'toys',petType:'dog'}).sort({price:1}).limit(12).explain('executionStats'); printjson({ indexName: (e.queryPlanner.winningPlan.inputStage && e.queryPlanner.winningPlan.inputStage.indexName) || (e.queryPlanner.winningPlan.inputStage && e.queryPlanner.winningPlan.inputStage.inputStage && e.queryPlanner.winningPlan.inputStage.inputStage.indexName) || null, totalDocsExamined: e.executionStats.totalDocsExamined, totalKeysExamined: e.executionStats.totalKeysExamined, nReturned: e.executionStats.nReturned, executionTimeMillis: e.executionStats.executionTimeMillis});"`
  - Key output snippets:
    - `indexName: 'category_1_petType_1_price_1'`
    - `totalDocsExamined: 12`, `totalKeysExamined: 12`, `nReturned: 12`
    - `executionTimeMillis: 10`

- Query 2:
  - Endpoint pattern: veterinaries listing
  - Command:
    - `docker exec project_with_react-mongo-1 mongosh --quiet --eval "function findIndexName(stage){ if(!stage||typeof stage!=='object') return null; if(stage.indexName) return stage.indexName; for(const k of Object.keys(stage)){ const v=stage[k]; if(Array.isArray(v)){ for(const s of v){ const r=findIndexName(s); if(r) return r; } } else if(v && typeof v==='object'){ const r=findIndexName(v); if(r) return r; } } return null; } const db2=db.getSiblingDB('tail-treasures'); const e=db2.users.find({role:'veterinary',isApproved:true},{name:1,email:1,phone:1,vetInfo:1,profileImage:1}).limit(50).explain('executionStats'); printjson({ indexName: findIndexName(e.queryPlanner.winningPlan), totalDocsExamined: e.executionStats.totalDocsExamined, totalKeysExamined: e.executionStats.totalKeysExamined, nReturned: e.executionStats.nReturned, executionTimeMillis: e.executionStats.executionTimeMillis});"`
  - Key output snippets:
    - `indexName: 'role_1_isApproved_1'`
    - `totalDocsExamined: 50`, `totalKeysExamined: 50`, `nReturned: 50`
    - `executionTimeMillis: 2`

---

## 3) Redis Caching (Measured Improvement)

### 3.1 What is cached

List cached endpoints and TTLs.

Cached endpoints used for benchmarking:
- `GET /api/products` TTL 180s
- `GET /api/appointments/veterinaries` TTL 120s

### 3.2 How to run benchmarks (Artillery)

1) Start stack (Redis ON):

- `docker compose up --build`

2) Run benchmark:

- `cd backend`
- `npm run benchmark:redis-on`

3) Start stack (Redis OFF) or set env:

- Option A: run backend with `REDIS_ENABLED=false`
- Option B: use `docker compose -f ../docker-compose.yml -f ../docker-compose.redis-off.yml up --build`

4) Run benchmark:

- `cd backend`
- `npm run benchmark:redis-off`

### 3.3 Benchmark outputs

Store the JSON output files in:
- `backend/test-reports/benchmarks/`

Latest files used for the results table:
- `products.redis-on.json`
- `products.redis-off.json`
- `veterinaries.redis-on.json`
- `veterinaries.redis-off.json`

Summarize using:
- `node scripts/summarizeArtillery.js <file.json>`

### 3.4 Results table

Fill this table from the summarized output:

| Scenario | Redis | RPS | Mean Latency (ms) | P95 Latency (ms) | 2xx | 4xx | 5xx |
|---|---:|---:|---:|---:|---:|---:|---:|
| Products | OFF | 24.079 | 99.8 | 198.4 | 960 | 0 | 0 |
| Products | ON  | 24.336 | 19.5 | 37.7 | 960 | 0 | 0 |
| Veterinaries | OFF | 2.084 | 69.4 | 117.9 | 40 | 0 | 0 |
| Veterinaries | ON  | 2.086 | 37.2 | 50.9 | 40 | 0 | 0 |

### 3.5 Conclusion

- Products endpoint improved from 99.8ms mean / 198.4ms p95 (OFF) to 19.5ms mean / 37.7ms p95 (ON): ~5.1x faster mean and ~5.3x faster p95.
- Veterinaries endpoint improved from 69.4ms mean / 117.9ms p95 (OFF) to 37.2ms mean / 50.9ms p95 (ON): ~1.9x faster mean and ~2.3x faster p95.
- Tradeoffs: cached responses can be stale for up to the TTL (180s for products list, 120s for veterinaries list). When fresh data is required, endpoints should bypass caching or invalidate the namespace version on writes.

---

## 4) Notes / Risks

- Redis is optional in this project; API continues to work if Redis is down.
- Document any limitations (e.g., cache TTLs, what is not cached).
