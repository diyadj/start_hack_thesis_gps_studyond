import './App.css'
import { useState } from 'react'
import { useJourneyStore } from '@/store/journeyStore'
import { IntakeForm } from '@/components/intake/IntakeForm'
import { JourneyMap } from '@/components/journey/JourneyMap'
import { StuckDialog } from '@/components/stuck/StuckDialog'

export default function App() {
  const { hasStarted, startJourney } = useJourneyStore()
  const [stuckStageId, setStuckStageId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      {!hasStarted ? (
        <IntakeForm onSubmit={startJourney} />
      ) : (
        <>
          {/* Journey map — owns its own top bar */}
          <JourneyMap onStuck={(id) => setStuckStageId(id)} />

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
