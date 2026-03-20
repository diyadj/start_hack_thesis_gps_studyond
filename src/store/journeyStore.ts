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

const STAGE_ORDER = [
  'orientation',
  'supervisor',
  'application',
  'planning',
  'execution',
  'writing',
  'submission',
  'apply_jobs',
] as const

export type StageId = typeof STAGE_ORDER[number]

export interface StageState {
  id: StageId
  status: StageStatus
}

const DEFAULT_STAGES: StageState[] = STAGE_ORDER.map((id) => ({ id, status: 'not_started' }))

function normalizeStages(stages: StageState[] | undefined): StageState[] {
  const stageMap = new Map((stages ?? []).map((stage) => [stage.id, stage.status]))
  return STAGE_ORDER.map((id) => ({ id, status: stageMap.get(id) ?? 'not_started' }))
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
  markStageDone: (stageId: StageId) => void
  resetJourney: () => void
}

// Maps the intake's currentStage value to the stages array
function buildInitialStages(currentStage: string): StageState[] {
  const currentIndex = STAGE_ORDER.indexOf(currentStage as StageId)
  const safeIndex = currentIndex === -1 ? 0 : currentIndex

  return STAGE_ORDER.map((id, index) => ({
    id,
    status:
      index < safeIndex
        ? 'done'
        : index === safeIndex
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
          const doneIndex = STAGE_ORDER.indexOf(stageId)
          if (doneIndex === -1) return state

          return {
            stages: STAGE_ORDER.map((id, index) => ({
              id,
              status:
                index < doneIndex
                  ? 'done'
                  : index === doneIndex
                    ? 'done'
                    : index === doneIndex + 1
                      ? 'active'
                      : 'not_started',
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
      version: 1,
      migrate: (persistedState) => {
        if (!persistedState) return persistedState
        return {
          ...persistedState,
          stages: normalizeStages((persistedState as JourneyStore).stages),
        }
      },
    }
  )
)
