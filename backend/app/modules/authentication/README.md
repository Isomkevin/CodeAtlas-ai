# Authentication module

Owns users, organizations, memberships, audit records, GitHub OAuth state, JWT session minting, and reusable role policies. Other modules may use `AuthenticationService` or `require_role`; they must not query these tables directly.

Run the schema migration with `uv run alembic upgrade head` after setting `CODEATLAS_DATABASE_URL`. OAuth requires the GitHub client ID, secret, and redirect URI environment variables. `GET /api/v1/auth/github/authorize` provides the authorization URL and GitHub returns to `/github/callback`, which verifies the state, fetches a verified primary email, provisions a first workspace when needed, records audit events, and returns a tenant-scoped JWT. JWT secrets must be replaced before a production deployment.
