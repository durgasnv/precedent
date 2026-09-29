# Personal access and collection ownership

PRECEDENT requires a personal access token for every API route except `GET /api/health`. The operator creates accounts from a shell with access to the backend SQLite database:

```bash
npm run auth:create-user -- "Durga"
```

The command prints a random token once. Give it to the named user through an appropriate private channel. The database stores only its SHA-256 hash. The first user claims existing collections and decisions imported from the legacy JSON file, including Engineering examples. Every later user starts with an empty personal collection. Collection IDs stay server-side authorization targets: sending another user's ID in `X-Precedent-Collection` returns 404, and collection listing returns only the caller's collections.

The live frontend asks for the token, verifies it through `GET /api/auth/me`, and keeps it in browser session storage for the current tab session. Requests use the `Authorization: Bearer <token>` header. Sign out removes it from session storage. A token is equivalent to account access; keep it private. To replace a lost or exposed token:

```bash
npm run auth:rotate-token -- "Durga"
```

The previous token stops working immediately. There is no public registration route. Account creation and rotation require shell access to the server. Users own their collections; sharing a collection with another user is not implemented.

`CORS_ORIGINS` is a comma-separated list of allowed browser origins, defaulting to local Vite ports 5173 and 5174. For a hosted frontend, set it to the frontend's actual HTTPS origin. Requests without a browser Origin header, such as server-side scripts, still require a bearer token for protected API routes.

## Request process

1. `requireAuth` hashes the presented random token and finds its user in SQLite.
2. The collection router checks that the selected collection belongs to that user before any decision, timeline, Hindsight analysis, or reassessment route runs.
3. Collection creation records the authenticated user as owner. The Hindsight bank is derived from the authorized collection, so a caller cannot select an unrelated bank through an arbitrary header.

The API tests check missing tokens, collection enumeration, cross-user record reads, and cross-user analysis requests. A storage test checks first-user ownership, token hashing, and token rotation.
