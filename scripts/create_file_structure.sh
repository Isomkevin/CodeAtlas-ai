#!/usr/bin/env bash

set -e

PROJECT_NAME="codeatlas"

echo "🚀 Creating CodeAtlas Monorepo..."

mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

########################################
# Root
########################################

mkdir -p \
apps \
packages \
docs \
infrastructure \
docker \
scripts \
.github/workflows

########################################
# Applications
########################################

mkdir -p \
apps/web \
apps/api \
apps/worker \
apps/mcp-server

########################################
# Shared Packages
########################################

mkdir -p \
packages/ui \
packages/sdk \
packages/graph \
packages/ai \
packages/shared \
packages/types \
packages/config

########################################
# Documentation
########################################

mkdir -p \
docs/00-overview \
docs/01-prd \
docs/02-architecture \
docs/03-engineering \
docs/04-agents \
docs/05-codex \
docs/06-design

########################################
# Infrastructure
########################################

mkdir -p \
infrastructure/docker \
infrastructure/kubernetes \
infrastructure/terraform \
infrastructure/github-actions

########################################
# Backend Structure
########################################

mkdir -p \
apps/api/app/modules \
apps/api/app/core \
apps/api/app/config \
apps/api/app/database \
apps/api/app/cache \
apps/api/app/events \
apps/api/app/security \
apps/api/app/utils \
apps/api/app/tests

########################################
# Modules
########################################

for module in \
authentication \
repository \
architecture \
graph \
documentation \
diagram \
implementation \
github \
mcp \
ai
do
mkdir -p apps/api/app/modules/$module/{controllers,services,repositories,models,schemas,events,workers,prompts,tools,tests}
done

########################################
# Workers
########################################

mkdir -p \
apps/worker/workers \
apps/worker/jobs \
apps/worker/tests

########################################
# MCP Server
########################################

mkdir -p \
apps/mcp-server/server \
apps/mcp-server/tools \
apps/mcp-server/resources \
apps/mcp-server/tests

########################################
# Scripts
########################################

touch \
README.md \
LICENSE \
.gitignore \
.env.example

########################################
# Docs
########################################

touch \
docs/README.md \
docs/00-overview/vision.md \
docs/00-overview/roadmap.md \
docs/01-prd/product-requirements.md \
docs/02-architecture/system-architecture.md \
docs/03-engineering/backend.md \
docs/04-agents/README.md \
docs/05-codex/implementation-roadmap.md \
docs/06-design/design-system.md

########################################
# Root README
########################################

cat > README.md <<EOF
# CodeAtlas

The Architecture Intelligence Layer for AI Software Engineering.

## Monorepo Structure

apps/
- web
- api
- worker
- mcp-server

packages/
- ui
- sdk
- graph
- ai
- shared
- types
- config

docs/

infrastructure/

docker/
EOF

echo ""
echo "✅ CodeAtlas monorepo created successfully."