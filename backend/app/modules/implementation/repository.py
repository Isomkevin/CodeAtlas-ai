"""Implementation-plan persistence adapter."""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.implementation.models import ImplementationPlan, PlanStatus


class ImplementationPlanRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        repository_id: UUID,
        graph_version_id: UUID,
        requested_by: UUID,
        change_request: str,
        plan: dict,
    ) -> ImplementationPlan:
        item = ImplementationPlan(
            repository_id=repository_id,
            graph_version_id=graph_version_id,
            requested_by=requested_by,
            change_request=change_request,
            plan_json=plan,
        )
        self._session.add(item)
        await self._session.flush()
        return item

    async def get(self, plan_id: UUID, repository_id: UUID) -> ImplementationPlan | None:
        return await self._session.scalar(
            select(ImplementationPlan).where(
                ImplementationPlan.id == plan_id,
                ImplementationPlan.repository_id == repository_id,
            )
        )

    async def list(self, repository_id: UUID) -> list[ImplementationPlan]:
        return list(
            (
                await self._session.scalars(
                    select(ImplementationPlan)
                    .where(ImplementationPlan.repository_id == repository_id)
                    .order_by(ImplementationPlan.created_at.desc())
                )
            ).all()
        )

    async def approve(self, plan: ImplementationPlan, approved_by: UUID) -> None:
        plan.status = PlanStatus.APPROVED
        plan.approved_by = approved_by
        plan.approved_at = datetime.now(UTC)
        await self._session.flush()

    async def complete_pull_request(self, plan: ImplementationPlan, url: str) -> None:
        plan.status = PlanStatus.PULL_REQUEST_OPENED
        plan.pull_request_url = url
        plan.completed_at = datetime.now(UTC)
        await self._session.flush()

    async def fail(self, plan: ImplementationPlan, error: Exception) -> None:
        plan.status = PlanStatus.FAILED
        plan.error = str(error)[:4000]
        await self._session.flush()

    async def commit(self) -> None:
        await self._session.commit()
