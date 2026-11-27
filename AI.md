# AI development log

## Planning and design

I used ChatGPT to help plan the design and implementation briefs. I asked Google Stitch for a professional authentication experience with React-compatible reusable components, accessible forms, responsive layouts, Inter typography, and a blue accent. The brief covered sign-in, sign-up, and the authenticated application page on desktop and mobile.

Stitch initially generated only mobile layouts. I asked for dedicated desktop designs and chose a single light theme to keep the assessment simple. I kept roles, organizations, two-factor authentication indicators, unrelated navigation, and unsupported security claims out of scope. Stitch’s revised output included desktop and mobile references for all three pages.

## Implementation prompt

I gave Codex the six Stitch exports and design specification as visual references, along with one brief covering the stack, authentication behavior, security, responsive layout, testing, Docker, CI, and documentation. I kept the architecture small and excluded Nx, Turborepo, microservices, refresh tokens, and unrelated authentication features. I favored a same-origin API proxy and required an isolated MongoDB test database.

Codex inspected the screenshots, exported HTML, and design specification, chose `fullstack-auth` as the project root, and implemented and verified the application.

The development host had Docker and browsers available. Node was absent from PATH. Codex targeted Node 24 LTS and chose TypeScript 6 based on the compatibility ranges published by Nest Swagger and the initially selected typescript-eslint tooling.

## Codex implementation decisions

- The frontend and backend are separate npm packages with their own lockfiles. Shared cards, buttons, and native inputs use Tailwind to match the reference layouts.
- Codex unified Apex branding, kept one account header and logout control, and removed unrelated navigation, footer links, version and account IDs, and unsupported security labels. The account page shows initials and profile fields from the authenticated API response.
- The app uses one same-origin API proxy and one configured browser origin for CSRF checks. A one-hour JWT is backed by a MongoDB session record so logout can revoke the current session immediately. A TTL index cleans up expired sessions, and a unique index handles concurrent registrations.
- Authentication tokens stay in HttpOnly cookies. The browser holds the public account and expiry in memory. Registration starts a session immediately. Duplicate registration returns HTTP 409 with a field error.
- API tests use Node’s test runner with compiled TypeScript. Frontend tests use Vitest and Testing Library, and Playwright runs the Chrome tests. Each integration run uses a newly named database. Browser tests use a separate Compose project.

## Findings and corrections

- Nest 12 packages are ESM. Codex moved the backend to native ESM and aligned the TypeScript decorator settings across the production build, development watcher, and tests.
- Installation surfaced an unsupported ESLint major in the compatible TypeScript linting range. Codex switched both packages to Oxlint. A later audit found a vulnerability in nodemon’s transitive minimatch dependency, so Codex used a scoped override to lock the patched release.
- Windows Application Control blocked Vite’s native Rolldown binding. Codex ran the package checks in Linux Docker containers and the browser checks in the installed Chrome against Compose.
- The initial frontend and browser suites found a race between logout navigation and the protected-route redirect. Codex moved the redirect into the guard so it runs after the cache drops the account and preserves the logout confirmation. Codex also shortened a signup password placeholder that was truncated at 320px.
- The implementation review found that a client clock ahead of the server could immediately expire a valid session in the UI. Codex based the local expiry deadline on the timestamp in the API response. The browser tests exercise a client clock two hours ahead.

## Initial verification

- Codex built the Compose stack and confirmed all three services were healthy with MongoDB 9.0.8. Port inspection showed that Compose published only the frontend on loopback. Codex verified a backend restart after a mounted source change and Vite CSS hot replacement in Chrome.
- Backend lint, type checking, the production build, and 12 integration tests passed against disposable MongoDB. The suite covered duplicate signup races, protected access, token expiry and revocation, production cookie attributes, CSRF, rate limits, and public response fields.
- Frontend lint, type checking, the production build, and seven component tests passed. Both npm audits reported zero vulnerabilities at the time.
- Both Chrome smoke tests passed at 1440 × 900 and 320 × 700. They checked keyboard focus and page width on all three routes. Codex reviewed screenshots of each page at both sizes and verified Swagger through the Vite proxy.
- Codex validated the GitHub Actions workflow with actionlint.

## Pre-submission fixes

- A separate Codex review confirmed that the signup API accepted passwords containing line breaks that Chrome strips from password inputs. Codex updated the backend DTO and frontend schema to reject carriage returns and line feeds during registration. Regression tests cover both characters and verify that surrounding spaces are preserved.
- The review also confirmed that an HTTPS origin selected development mode when `NODE_ENV` was absent. Codex updated configuration to require an explicit mode for HTTPS origins. A regression test covers the missing mode, explicit development mode, and the local HTTP default. The existing production test checks the secure host cookie and disabled Swagger.

## Final verification

- Codex’s first focused backend run skipped the registration fixture used by the production cookie test. Including it let all four selected backend tests pass. The focused frontend password test also passed.
- Both packages passed lint, type checking, and production builds. The full suites passed 14 backend tests against isolated MongoDB and eight frontend tests. Both Chrome smoke tests passed at 1440px and 320px.
- Codex built and started the Docker Compose stack and ran both production builds from a temporary copy that excluded `design/`. The README identifies the retained exports as design references.
- Codex initialized local Git on `main` and inspected the staged files for credentials, private environment files, and generated outputs. GitHub-hosted CI and deployment behind a production HTTPS proxy remain unverified.

## Auth controller follow-up

- I asked Codex to make the signup, signin, and logout handlers easier to read. Signup and signin now set the session cookie through `setSessionCookie` and return the response body explicitly. Logout reads the session token into a local variable before revoking the session and clearing the cookie.
- Backend lint, type checking, and all 14 integration tests passed in Docker against a disposable MongoDB instance.

## What worked well with AI

- The consolidated prompt gave Codex one place to check how the stack, security requirements, and tests fit together. It tied the Docker setup and isolated test data to a browser test of the real authentication flow.
- Being explicit about scope kept the design and implementation focused on the three required screens and a straightforward session lifecycle.
- The Stitch exports made the desktop and mobile layouts concrete and helped Codex translate them into shared components.
- A separate pre-submission review checked the finished app against the brief and surfaced two narrow fixes with clear regression tests.
