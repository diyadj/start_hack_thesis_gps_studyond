import './App.css'
import { useState } from 'react'
import { useJourneyStore } from '@/store/journeyStore'
import { IntakeForm } from '@/components/intake/IntakeForm'
import { JourneyMap } from '@/components/journey/JourneyMap'
import { MatchSection } from '@/components/match/MatchSection'
import { StuckDialog } from '@/components/stuck/StuckDialog'

export default function App() {
  const { hasStarted, intake, startJourney, resetJourney } = useJourneyStore()
  const [stuckStageId, setStuckStageId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      {!hasStarted ? (
        <IntakeForm onSubmit={startJourney} />
      ) : (
        <>
          {/* Top nav */}
          <header className="sticky top-0 z-30 bg-background border-b border-border px-4 h-12 flex items-center justify-between">
            <p className="ds-label">🧭 Thesis GPS</p>
            <button
              onClick={resetJourney}
              className="ds-small text-muted-foreground hover:text-foreground transition-colors"
            >
              Start over
            </button>
          </header>

          {/* Journey map */}
          <JourneyMap onStuck={(id) => setStuckStageId(id)} />

          {/* Match section — only shows if student provided field IDs */}
          {intake && intake.fieldIds.length > 0 && (
            <MatchSection
              studentFieldIds={intake.fieldIds}
              studentTopic={intake.topic}
              studentName="Student"
            />
          )}

          {/* Stuck dialog */}
          <StuckDialog
            stageId={stuckStageId}
            onClose={() => setStuckStageId(null)}
          />
        </>
      )}
    </div>
  )
}
