# Apex

Apex is a small authentication application. Users can create an account, sign in, view their account name and email, and log out. Registration starts a session immediately. The React application and NestJS API share a browser origin.

The screenshots, HTML exports, and design specification in `design/` are non-production Google Stitch references. The application builds from `frontend/` and `backend/` independently of those exports.

## Stack

- React, Vite, strict TypeScript, Tailwind CSS, Inter, and React Router
- React Hook Form and Zod for form validation, Axios for requests, and TanStack Query for session state
- NestJS, class-validator, Mongoose, MongoDB, Argon2id, JWT, and Swagger/OpenAPI
- npm lockfiles, Docker Compose, GitHub Actions, Vitest, Supertest, and Playwright

## Run with Docker Compose

Run these commands from the project root, the `fullstack-auth` directory. You need Docker with Compose v2.

1. Copy `.env.example` to `.env`.
2. Fill in `JWT_SECRET` with a randomly generated value. Generate one with `openssl rand -hex 32` or `docker run --rm node:24-bookworm-slim node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
3. Run `docker compose up --build --wait`.

| Address | Purpose |
| --- | --- |
| http://localhost:5173/signin | Sign in |
| http://localhost:5173/signup | Register |
| http://localhost:5173/app | Protected account page |
| http://localhost:5173/api/docs | Swagger UI |
| http://localhost:5173/api/docs-json | OpenAPI JSON |
| http://localhost:5173/api/health | API readiness |

Open the app on the exact origin in `APP_ORIGIN`. If you change the host port, update `FRONTEND_PORT` and `APP_ORIGIN` together. If port 5173 is occupied, use a different port in both values.

Vite proxies `/api` internally to the backend. Frontend edits use hot module replacement and backend source edits trigger recompilation and restart. Rebuild after editing dependencies or tool configuration. Compose publishes the frontend on loopback and keeps the backend and MongoDB on its internal network. `docker compose down` stops the services and preserves the MongoDB named volume.

## Run locally with npm

You need Node.js 24 LTS, npm, and MongoDB 9.0. A loopback-only MongoDB container works for local development outside Compose.

```sh
docker run -d --name apex-local-mongo -p 127.0.0.1:27017:27017 -v apex-local-mongo:/data/db mongo:9.0
```

Create `backend/.env` with the following values and fill in the generated secret.

```dotenv
APP_ORIGIN=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/apex
JWT_SECRET=
```

Run the backend and frontend in separate terminals from the project root.

```sh
npm --prefix backend ci
npm --prefix backend run dev
```

```sh
npm --prefix frontend ci
npm --prefix frontend run dev
```

The Docker port 5173 and development Vite port 5173 are alternatives. Stop one before starting the other on the same port.

## Environment variables

| Variable | Default or required value | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | Required, at least 32 bytes | Generate a random signing secret and keep it in secret storage |
| `APP_ORIGIN` | Required by the API. Compose defaults to `http://localhost:5173` | Canonical browser origin including scheme and non-default port, without a trailing slash |
| `MONGO_URI` | Required by the API. Compose uses `mongodb://mongodb:27017/apex` | MongoDB connection string including the database name |
| `NODE_ENV` | Defaults to `development` for HTTP. Required when `APP_ORIGIN` uses HTTPS | Use `production` for secure cookies and to disable Swagger |
| `PORT` | `3000` | API listen port |
| `SESSION_TTL_SECONDS` | `3600` | Absolute session lifetime in seconds, from 60 to 86400 |
| `TRUST_PROXY_HOPS` | `0` locally, `1` on Compose | Exact number of trusted reverse proxy hops, from 0 to 3 |
| `FRONTEND_PORT` | `5173` | Compose frontend port on the host |
| `API_PROXY_TARGET` | `http://127.0.0.1:3000` | Optional Vite API upstream for local development |
| `WATCH_POLL` | `false` locally, `true` on Compose | Enables Vite polling for Docker Desktop source mounts |

## API

| Method and path | Body | Success |
| --- | --- | --- |
| `POST /api/auth/signup` | `{ "name": "...", "email": "...", "password": "..." }` | `201`, sets the session cookie |
| `POST /api/auth/signin` | `{ "email": "...", "password": "..." }` | `200`, sets the session cookie |
| `POST /api/auth/logout` | None | `204`, revokes the current session and clears the cookie |
| `GET /api/auth/me` | None | `200` with a valid session cookie |
| `GET /api/health` | None | `200` when connected to MongoDB, `503` otherwise |

Signup, signin, and me return `{ "user": { "name": "...", "email": "..." }, "expiresAt": 0 }`, where `expiresAt` is the expiry timestamp in Unix milliseconds. All authentication POST requests require an exact `Origin` match. To use the interactive Swagger UI, open it through the same frontend origin as the app.

Errors use `{ "statusCode": 400, "message": "...", "fields": { "email": "..." } }`. The `fields` object is optional. The API uses `400` for invalid input, `401` for invalid credentials or an unauthenticated session check, `403` for an invalid origin, `409` for a duplicate email, and `429` for rate limiting.

## Tests and builds

The backend suite requires a disposable MongoDB instance. It connects only via `TEST_MONGO_URI`, creates a uniquely named database, and drops that database during teardown. Use a standalone test instance as shown below. In PowerShell, set the variable with `$env:TEST_MONGO_URI = 'mongodb://127.0.0.1:27018'` before running the backend command.

```sh
docker run --rm -d --name apex-integration-mongo -p 127.0.0.1:27018:27017 mongo:9.0
# Wait for this to report ok: 1 before running the suite.
docker exec apex-integration-mongo mongosh --quiet --eval 'db.adminCommand({ping: 1})'
TEST_MONGO_URI=mongodb://127.0.0.1:27018 npm --prefix backend test
docker stop apex-integration-mongo
npm --prefix frontend test
```

```sh
npm --prefix backend run lint
npm --prefix backend run typecheck
npm --prefix backend run build
npm --prefix frontend run lint
npm --prefix frontend run typecheck
npm --prefix frontend run build
```

Run the browser smoke test against a separate Compose project. It creates test accounts. The scoped teardown below deletes only the browser-test project’s volume. Install the Playwright browser once with `npm --prefix frontend exec -- playwright install chromium`, or set `PLAYWRIGHT_CHANNEL` to an installed Chromium browser such as `chrome` or `msedge`.

```sh
FRONTEND_PORT=5174 APP_ORIGIN=http://localhost:5174 MONGO_URI=mongodb://mongodb:27017/apex_browser_test docker compose -p apex-browser-test up --build --wait
E2E_BASE_URL=http://localhost:5174 npm --prefix frontend run test:e2e
docker compose -p apex-browser-test down --volumes
```

On PowerShell, set the variables on their own lines before executing the corresponding commands and clear them afterward with `Remove-Item Env:FRONTEND_PORT, Env:APP_ORIGIN, Env:MONGO_URI, Env:E2E_BASE_URL`. CI runs `npm ci`, lint, type checking, package tests, production builds, and the Chromium smoke tests. The backend job uses a MongoDB service and the browser job starts its own Compose stack.

## Architecture and security

- **Users and authentication.** The Users module owns persistence and the unique normalized email index. Signup trims names and trims and lowercases email. Validation uses the same ASCII email format and Unicode character rules on both sides. The API catches duplicate database writes, including concurrent signups.
- **Credentials.** Registration rejects line breaks in passwords and preserves the other characters as entered. Passwords are hashed with Argon2id. The default user query excludes the hash, and auth responses explicitly select the public fields. Signin uses the same error for unknown emails and incorrect passwords, and uses a dummy hash for verification if the user is unknown.
- **Sessions.** A signed HS256 JWT holds the user ID, session ID, and expiration. The API checks signing algorithm, issuer, audience, expiration, and the active MongoDB session on each protected request. The cookie is HttpOnly and SameSite=Strict. Production uses Secure and the host-only `__Host-apex_session` cookie. MongoDB's TTL index removes expired sessions. Logout deletes the current session before clearing its cookie and can be repeated. Other browser sessions have their own lifetimes.
- **Browser protection.** Each authentication write checks the browser's exact `Origin`, including signup and signin. The app shares an origin with the API and uses no CORS grants. Helmet supplies response security headers. Authentication responses use `Cache-Control: no-store`. The frontend keeps the current account in memory and checks `/me` after a reload or on window focus. It clears the account on logout or expiry.
- **Request handling.** Per-IP limits are 8 signup, 12 signin, 30 logout, and 120 me requests per minute. Express receives a bounded JSON body. Validation errors omit submitted values, and the API avoids logging request bodies, passwords, cookie values, and tokens.

## Production considerations

Serve the built frontend and proxy `/api` to the built backend through the same HTTPS origin. Serve `index.html` for browser routes and keep TLS termination and static response security headers at the reverse proxy. Set `NODE_ENV=production`, configure an authenticated MongoDB connection, and provision a random signing secret in the deployment environment. The backend database account needs permission to create the user and session indexes at startup. Production Swagger is disabled.

Keep the backend private and configure the proxy to replace client-supplied forwarding headers before setting `TRUST_PROXY_HOPS`. Rate limits are in memory per backend process. Use shared rate-limit storage or a trusted edge limiter before deploying multiple replicas. A duplicate signup intentionally returns 409, which reveals whether an address has registered. Sessions use an absolute lifetime and require the user to sign in again after expiration. If session creation fails after a user record was inserted, that account can sign in once the database recovers. The development Compose stack uses an unauthenticated MongoDB on its internal network.
