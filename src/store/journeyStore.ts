import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// The shape of what the student fills in during intake
export interface IntakeData {
  topic: string
  university: string
  currentStage: string
  deadline: string
  degree: 'bsc' | 'msc' | 'phd'
  fieldIds: string[]
}

// Each stage can be: not started, active (current), done
export type StageStatus = 'not_started' | 'active' | 'done'

export interface StageState {
  id: string
  status: StageStatus
}

interface JourneyStore {
  // Has the student completed intake?
  hasStarted: boolean

  // Intake data from the form
  intake: IntakeData | null

  // Which stages are done/active/not started
  stages: StageState[]

  // Actions
  startJourney: (intake: IntakeData) => void
  markStageDone: (stageId: string) => void
  resetJourney: () => void
}

const DEFAULT_STAGES: StageState[] = [
  { id: 'orientation', status: 'not_started' },
  { id: 'supervisor', status: 'not_started' },
  { id: 'planning', status: 'not_started' },
  { id: 'execution', status: 'not_started' },
  { id: 'writing', status: 'not_started' },
  { id: 'submission', status: 'not_started' },
  { id: 'apply_jobs', status: 'not_started' },
]

// Maps the intake's currentStage value to the stages array
function buildInitialStages(currentStage: string): StageState[] {
  const stageOrder = ['orientation', 'supervisor', 'planning', 'execution', 'writing', 'submission', 'apply_jobs']
  const currentIndex = stageOrder.indexOf(currentStage)

  return stageOrder.map((id, index) => ({
    id,
    status:
      index < currentIndex
        ? 'done'
        : index === currentIndex
          ? 'active'
          : 'not_started',
  }))
}

export const useJourneyStore = create<JourneyStore>()(
  persist(
    (set) => ({
      hasStarted: false,
      intake: null,
      stages: DEFAULT_STAGES,

      startJourney: (intake) => {
        set({
          hasStarted: true,
          intake,
          stages: buildInitialStages(intake.currentStage),
        })
      },

      markStageDone: (stageId) => {
        set((state) => {
          const stageOrder = ['orientation', 'supervisor', 'planning', 'execution', 'writing', 'submission', 'apply_jobs']
          const doneIndex = stageOrder.indexOf(stageId)

          return {
            stages: state.stages.map((s, index) => ({
              id: s.id,
              status:
                index < doneIndex
                  ? 'done'
                  : index === doneIndex
                    ? 'done'
                    : index === doneIndex + 1
                      ? 'active'
                      : s.status,
            })),
          }
        })
      },

      resetJourney: () => {
        set({ hasStarted: false, intake: null, stages: DEFAULT_STAGES })
      },
    }),
    {
      // This key is what gets saved to localStorage
      name: 'thesis-gps-journey',
    }
  )
)
