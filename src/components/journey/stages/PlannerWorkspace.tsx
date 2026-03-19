import { KanbanColumn } from './KanbanColumn'

type PlannerItem = {
  id: string
  stageId: string
  stageLabel: string
  text: string
  status: 'todo' | 'in_progress' | 'done'
}

interface PlannerWorkspaceProps {
  plannerItems: PlannerItem[]
  borderColor: string
  textColor: string
  mutedColor: string
}

export function PlannerWorkspace({
  plannerItems,
  borderColor,
  textColor,
  mutedColor,
}: PlannerWorkspaceProps) {
  const todoItems = plannerItems.filter((t) => t.status === 'todo')
  const inProgressItems = plannerItems.filter((t) => t.status === 'in_progress')
  const doneItems = plannerItems.filter((t) => t.status === 'done')

  return (
    <div className="space-y-4 mt-6">
      <p className="ds-label font-semibold" style={{ color: textColor }}>
        Project Manager Board
      </p>

      <div className="grid gap-3 lg:grid-cols-3">
        <KanbanColumn
          title="To Do"
          items={todoItems}
          borderColor={borderColor}
          textColor={textColor}
          mutedColor={mutedColor}
        />
        <KanbanColumn
          title="In Progress"
          items={inProgressItems}
          borderColor={borderColor}
          textColor={textColor}
          mutedColor={mutedColor}
        />
        <KanbanColumn
          title="Done"
          items={doneItems}
          borderColor={borderColor}
          textColor={textColor}
          mutedColor={mutedColor}
        />
      </div>

      <div className="rounded-lg p-4" style={{ border: `1px solid ${borderColor}`, backgroundColor: '#FFFFFF' }}>
        <p className="ds-label font-semibold" style={{ color: textColor }}>Things you still need to do</p>
        <ul className="mt-2 space-y-1">
          {todoItems.slice(0, 8).map((item) => (
            <li key={item.id} className="ds-small" style={{ color: mutedColor }}>
              • [{item.stageLabel}] {item.text}
            </li>
          ))}
          {todoItems.length === 0 && (
            <li className="ds-small" style={{ color: mutedColor }}>All tracked tasks are complete for now.</li>
          )}
        </ul>
      </div>
    </div>
  )
}
