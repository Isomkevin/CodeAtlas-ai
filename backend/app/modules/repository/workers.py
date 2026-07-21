"""Background scan executor independent of HTTP request lifetime."""

import asyncio
from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException
from neo4j import AsyncGraphDatabase
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.database import create_session_factory
from app.events import publish_repository_event
from app.modules.authentication.github_credentials import GitHubCredentialService
from app.modules.authentication.repository import AuthenticationRepository
from app.modules.graph.repository import GraphVersionRepository
from app.modules.graph.service import GraphService
from app.modules.graph.store import Neo4jGraphStore
from app.modules.repository.models import Repository, RepositoryScan, ScanStatus, SourceFactRecord
from app.modules.repository.scanner import scan_repository


async def _access_token_for_scan(
    repository: Repository, session: AsyncSession, settings: Settings
) -> str | None:
    """Use OAuth when configured; allow anonymous public clones only in local demo mode."""
    if repository.credential_owner_id is None:
        return None
    try:
        return await GitHubCredentialService(
            AuthenticationRepository(session), settings
        ).access_token_for(repository.credential_owner_id)
    except HTTPException as error:
        if (
            error.status_code == 403
            and settings.environment == "development"
            and settings.allow_development_login
        ):
            return None
        raise


async def execute_scan(database_url: str, scan_id: UUID, settings: Settings) -> None:
    session_factory = create_session_factory(database_url)
    async with session_factory() as session:
        scan = await session.scalar(select(RepositoryScan).where(RepositoryScan.id == scan_id))
        if scan is None:
            return
        repository = await session.get(Repository, scan.repository_id)
        if repository is None:
            scan.status = ScanStatus.FAILED
            scan.error = "Repository no longer exists"
            scan.completed_at = datetime.now(UTC)
            await session.commit()
            return
        scan.status = ScanStatus.RUNNING
        await session.commit()
        await publish_repository_event(
            settings.redis_url,
            repository.id,
            {"type": "scan.running", "scan_id": str(scan.id)},
        )
        try:
            token = await _access_token_for_scan(repository, session, settings)
            commit_sha, summary = await asyncio.to_thread(
                scan_repository, repository.clone_url, repository.default_branch, token
            )
            facts = summary.pop("facts")
            scan.commit_sha = commit_sha
            scan.summary = summary
            session.add_all([SourceFactRecord(scan_id=scan.id, **fact) for fact in facts])
            await session.commit()
            if not settings.neo4j_uri:
                raise RuntimeError("Repository scans require CODEATLAS_NEO4J_URI")
            driver = AsyncGraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_username, settings.neo4j_password.get_secret_value()),
            )
            try:
                graph_version = await GraphService(
                    GraphVersionRepository(session), Neo4jGraphStore(driver)
                ).project_scan(repository.id, scan)
                scan.status = ScanStatus.COMPLETED
                scan.completed_at = datetime.now(UTC)
                await publish_repository_event(
                    settings.redis_url,
                    repository.id,
                    {
                        "type": "scan.completed",
                        "scan_id": str(scan.id),
                        "graph_version_id": str(graph_version.id),
                    },
                )
            finally:
                await driver.close()
        except Exception as error:
            scan.status = ScanStatus.FAILED
            scan.error = str(error)[:4000]
            scan.completed_at = datetime.now(UTC)
            await publish_repository_event(
                settings.redis_url,
                repository.id,
                {"type": "scan.failed", "scan_id": str(scan.id), "message": scan.error},
            )
        await session.commit()
