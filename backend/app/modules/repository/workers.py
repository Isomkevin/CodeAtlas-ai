"""Background scan executor independent of HTTP request lifetime."""

import asyncio
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select

from app.database import create_session_factory
from app.modules.repository.models import RepositoryScan, ScanStatus, SourceFactRecord
from app.modules.repository.scanner import scan_repository


async def execute_scan(database_url: str, scan_id: UUID, clone_url: str, branch: str) -> None:
    session_factory = create_session_factory(database_url)
    async with session_factory() as session:
        scan = await session.scalar(select(RepositoryScan).where(RepositoryScan.id == scan_id))
        if scan is None:
            return
        scan.status = ScanStatus.RUNNING
        await session.commit()
        try:
            commit_sha, summary = await asyncio.to_thread(scan_repository, clone_url, branch)
            facts = summary.pop("facts")
            scan.status = ScanStatus.COMPLETED
            scan.commit_sha = commit_sha
            scan.summary = summary
            scan.completed_at = datetime.now(UTC)
            session.add_all([SourceFactRecord(scan_id=scan.id, **fact) for fact in facts])
        except Exception as error:
            scan.status = ScanStatus.FAILED
            scan.error = str(error)[:4000]
            scan.completed_at = datetime.now(UTC)
        await session.commit()
