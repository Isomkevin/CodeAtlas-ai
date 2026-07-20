# Authentication module

Owns users, organizations, memberships, audit records, GitHub OAuth state, JWT session minting, and reusable role policies. Other modules may use `AuthenticationService` or `require_role`; they must not query these tables directly.

Run the schema migration with `uv run alembic upgrade head` after setting `CODEATLAS_DATABASE_URL`. OAuth requires the GitHub client ID, secret, and redirect URI environment variables. JWT secrets must be replaced before a production deployment.
