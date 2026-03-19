import { OrientationWorkspace } from './stages/OrientationWorkspace'
import { SupervisorWorkspace } from './stages/SupervisorWorkspace'
import { PlannerWorkspace } from './stages/PlannerWorkspace'

type StageId = 'orientation' | 'supervisor' | 'planning' | 'execution' | 'writing' | 'submission' | 'apply_jobs'

type PlannerItem = {
  id: string
  stageId: string
  stageLabel: string
  text: string
  status: 'todo' | 'in_progress' | 'done'
}

interface StageWorkspaceProps {
  activeStageId: StageId
  topic: string
  supervisorRecommendations: {
    experts: Array<{
      score: number
      relevance: string
      expert: { id: string; firstName: string; lastName: string; companyName?: string; title: string }
    }>
    supervisors: Array<{
      score: number
      relevance: string
      supervisor: { id: string; firstName: string; lastName: string; title: string }
    }>
  }
  plannerItems: PlannerItem[]
  borderColor: string
  textColor: string
  mutedColor: string
  accentBlue: string
}

export function StageWorkspace({
  activeStageId,
  topic,
  supervisorRecommendations,
  plannerItems,
  borderColor,
  textColor,
  mutedColor,
  accentBlue,
}: StageWorkspaceProps) {
  return (
    <section className="px-4 sm:px-6 pb-8 pt-5" style={{ borderTop: `1px solid ${borderColor}` }}>
      <div className="mb-4">
        <h3 className="ds-title-sm font-semibold" style={{ color: textColor }}>
          Stage Workspace
        </h3>
        <p className="ds-small" style={{ color: mutedColor }}>
          Scroll for recommendations and project management tools for your current phase.
        </p>
      </div>

      {activeStageId === 'orientation' && (
        <OrientationWorkspace
          topic={topic}
          borderColor={borderColor}
          textColor={textColor}
          mutedColor={mutedColor}
          accentBlue={accentBlue}
        />
      )}

      {activeStageId === 'supervisor' && (
        <SupervisorWorkspace
          supervisorRecommendations={supervisorRecommendations}
          borderColor={borderColor}
          textColor={textColor}
          mutedColor={mutedColor}
          accentBlue={accentBlue}
        />
      )}

      {!['orientation', 'supervisor'].includes(activeStageId) && (
        <PlannerWorkspace
          plannerItems={plannerItems}
          borderColor={borderColor}
          textColor={textColor}
          mutedColor={mutedColor}
        />
      )}
    </section>
  )
}
