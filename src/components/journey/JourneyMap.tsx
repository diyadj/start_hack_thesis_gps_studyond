import { motion } from 'framer-motion'
import { Check, MapPin } from 'lucide-react'
import { STAGES, JOURNEY, URGENCY_MESSAGES } from '@/lib/copy'
import { weeksUntil, getUrgency } from '@/lib/utils'
import { useJourneyStore } from '@/store/journeyStore'
import type { StageState } from '@/store/journeyStore'

interface JourneyMapProps {
  onStuck: (stageId: string) => void
}

export function JourneyMap({ onStuck }: JourneyMapProps) {
  const { intake, stages, markStageDone } = useJourneyStore()

  if (!intake) return null

  const weeksLeft = weeksUntil(intake.deadline)
  const urgency = getUrgency(weeksLeft)

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="ds-label text-muted-foreground mb-1">Studyond — Thesis GPS</p>
          <h1 className="ds-title-lg mb-2">
            {intake.topic ? `"${intake.topic}"` : 'Your thesis journey'}
          </h1>
          <div className="flex items-center gap-3">
            <span className="ds-small text-muted-foreground">{intake.university}</span>
            <span className="text-border">·</span>
            <span
              className={`ds-small font-medium ${
                urgency === 'urgent'
                  ? 'text-destructive'
                  : urgency === 'moderate'
                    ? 'text-amber-600'
                    : 'text-muted-foreground'
              }`}
            >
              {JOURNEY.weeksLeft(weeksLeft)}
            </span>
          </div>

          {/* Urgency banner */}
          {urgency === 'urgent' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/5"
            >
              <p className="ds-small text-destructive">{URGENCY_MESSAGES.urgent}</p>
            </motion.div>
          )}
          {urgency === 'moderate' && (
            <p className="ds-small text-muted-foreground mt-3">{URGENCY_MESSAGES.moderate}</p>
          )}
        </motion.div>

        {/* Stage list */}
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-5 top-5 bottom-5 w-px bg-border" />

          <div className="space-y-4">
            {stages.map((stageState, index) => {
              const stageMeta = STAGES.find((s) => s.id === stageState.id)
              if (!stageMeta) return null
              return (
                <StageCard
                  key={stageState.id}
                  stageState={stageState}
                  stageMeta={stageMeta}
                  index={index}
                  weeksLeft={weeksLeft}
                  onMarkDone={() => markStageDone(stageState.id)}
                  onStuck={() => onStuck(stageState.id)}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

interface StageCardProps {
  stageState: StageState
  stageMeta: typeof STAGES[number]
  index: number
  weeksLeft: number
  onMarkDone: () => void
  onStuck: () => void
}

function StageCard({ stageState, stageMeta, index, onMarkDone, onStuck }: StageCardProps) {
  const isDone = stageState.status === 'done'
  const isActive = stageState.status === 'active'
  const isLocked = stageState.status === 'not_started'

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex gap-4"
    >
      {/* Stage indicator */}
      <div className="relative z-10 flex-shrink-0">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
            isDone
              ? 'bg-foreground border-foreground text-primary-foreground'
              : isActive
                ? 'bg-background border-foreground'
                : 'bg-background border-border'
          }`}
        >
          {isDone ? (
            <Check className="w-4 h-4" />
          ) : isActive ? (
            <MapPin className="w-4 h-4" />
          ) : (
            <span className="ds-caption text-muted-foreground">{index + 1}</span>
          )}
        </div>
      </div>

      {/* Card content */}
      <div
        className={`flex-1 mb-2 rounded-2xl border p-5 transition-all duration-300 ${
          isDone
            ? 'border-border opacity-50'
            : isActive
              ? 'border-foreground shadow-sm'
              : 'border-border opacity-60'
        }`}
      >
        {/* Stage header */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <span>{stageMeta.icon}</span>
            <h2 className="ds-title-cards">{stageMeta.label}</h2>
          </div>
          {isActive && (
            <span className="ds-badge px-2 py-0.5 rounded-full bg-foreground text-primary-foreground">
              {JOURNEY.currentStageLabel}
            </span>
          )}
          {isDone && (
            <span className="ds-badge px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {JOURNEY.completedLabel}
            </span>
          )}
        </div>

        <p className="ds-small text-muted-foreground mb-4">{stageMeta.description}</p>

        {/* Actions — only visible on active stage */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2 flex-wrap"
          >
            <button
              onClick={onMarkDone}
              className="px-4 py-2 bg-foreground text-primary-foreground rounded-full ds-small font-medium hover:opacity-80 transition-opacity"
            >
              {JOURNEY.markDoneButton}
            </button>
            <button
              onClick={onStuck}
              className="px-4 py-2 border border-border rounded-full ds-small text-muted-foreground hover:border-foreground hover:text-foreground transition-all duration-200"
            >
              {JOURNEY.stuckButton}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
