import { useMemo } from 'react'
import { projects, topics, supervisors, experts } from '../data'
import type { Project, Topic } from '../data'

type StageId = 'orientation' | 'supervisor' | 'planning' | 'execution' | 'writing' | 'submission' | 'apply_jobs'

interface RecommendedTopic {
  topic: Topic
  score: number
  relevance: string
  employmentSignal?: 'yes' | 'no' | 'open'
  similarProjects: Project[]
}

interface RecommendedSupervisor {
  supervisor: typeof supervisors[0]
  score: number
  relevance: string
  fieldMatch: string[]
}

interface RecommendedExpert {
  expert: typeof experts[0]
  score: number
  relevance: string
  fieldMatch: string[]
}

interface RecommendedProject {
  project: Project
  score: number
  relevance: string
}

interface UseRecommendationsResult {
  topics: RecommendedTopic[]
  supervisors: RecommendedSupervisor[]
  experts: RecommendedExpert[]
  similarProjects: RecommendedProject[]
}

/**
 * Stage-aware recommendation hook
 * Ranks topics, supervisors, experts, and projects based on the current stage
 */
export function useRecommendations(
  stage: StageId,
  selectedTopic: string | null,
  fieldIds: string[] = []
): UseRecommendationsResult {
  return useMemo(() => {
    const result: UseRecommendationsResult = {
      topics: [],
      supervisors: [],
      experts: [],
      similarProjects: [],
    }

    switch (stage) {
      case 'orientation':
        return {
          ...result,
          topics: recommendTopicsForOrientation(fieldIds),
        }

      case 'supervisor':
        return {
          ...result,
          supervisors: recommendSupervisorsForTopic(selectedTopic),
          experts: recommendExpertsForTopic(selectedTopic),
          topics: recommendTopicsForOrientation(fieldIds), // Keep topic suggestions available
        }

      case 'planning':
      case 'execution':
        return {
          ...result,
          similarProjects: recommendSimilarProjects(selectedTopic, 'in_progress'),
          supervisors: recommendSupervisorsForTopic(selectedTopic),
        }

      case 'writing':
        return {
          ...result,
          similarProjects: recommendSimilarProjects(selectedTopic, 'completed'),
          supervisors: recommendSupervisorsForTopic(selectedTopic),
        }

      case 'submission':
        return {
          ...result,
          similarProjects: recommendSimilarProjects(selectedTopic, 'completed'),
        }

      case 'apply_jobs':
        return {
          ...result,
          topics: recommendJobTopics(fieldIds),
          experts: recommendExpertsForJobSearch(fieldIds),
        }

      default:
        return result
    }
  }, [stage, selectedTopic, fieldIds])
}

/**
 * Recommend topics for orientation stage
 * Shows diverse topics with employment signal emphasis
 */
function recommendTopicsForOrientation(fieldIds: string[]): RecommendedTopic[] {
  return (topics as Topic[])
    .map((topic) => {
      const fieldMatch = topic.fieldIds.length > 0
        ? topic.fieldIds.filter((f) => fieldIds.includes(f)).length > 0
        : false

      const score =
        (fieldMatch ? 0.5 : 0) +
        (topic.employment === 'yes' ? 0.3 : 0) +
        (topic.employment === 'open' ? 0.2 : 0) +
        Math.random() * 0.1 // Tie-breaker

      const similarProjects = (projects as Project[]).filter(
        (p) => p.topicId === topic.id
      )

      return {
        topic,
        score,
        relevance: fieldMatch
          ? `Aligns with your interests • ${topic.employment === 'yes' ? 'Employment available' : topic.employment === 'open' ? 'Potential employment' : 'Academic'}`
          : topic.employment === 'yes'
            ? 'Employment available'
            : 'Potential opportunity',
        employmentSignal: topic.employment,
        similarProjects,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5) // Top 5
}

/**
 * Recommend supervisors for a selected topic
 */
function recommendSupervisorsForTopic(topicId: string | null): RecommendedSupervisor[] {
  if (!topicId) return []

  const topic = (topics as Topic[]).find((t) => t.id === topicId)
  if (!topic) return []

  return supervisors
    .map((supervisor) => {
      const fieldMatch = supervisor.fieldIds.filter((f) =>
        topic.fieldIds.includes(f)
      )

      const score = fieldMatch.length > 0 ? fieldMatch.length * 0.4 : 0

      return {
        supervisor,
        score,
        relevance:
          fieldMatch.length > 0
            ? `${fieldMatch.length} field match${fieldMatch.length > 1 ? 'es' : ''}`
            : 'Available',
        fieldMatch: fieldMatch.slice(0, 2),
      }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

/**
 * Recommend experts for a selected topic
 */
function recommendExpertsForTopic(topicId: string | null): RecommendedExpert[] {
  if (!topicId) return []

  const topic = (topics as Topic[]).find((t) => t.id === topicId)
  if (!topic) return []

  return experts
    .map((expert) => {
      const fieldMatch = expert.fieldIds.filter((f) =>
        topic.fieldIds.includes(f)
      )

      const score =
        (fieldMatch.length > 0 ? fieldMatch.length * 0.4 : 0) +
        (expert.offerInterviews ? 0.2 : 0)

      return {
        expert,
        score,
        relevance:
          fieldMatch.length > 0
            ? `${fieldMatch.length} field match${fieldMatch.length > 1 ? 'es' : ''} • ${expert.offerInterviews ? 'Open to interviews' : ''}`
            : expert.offerInterviews
              ? 'Open to interviews'
              : 'Available',
        fieldMatch: fieldMatch.slice(0, 2),
      }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

/**
 * Recommend similar projects for a given topic and state
 */
function recommendSimilarProjects(
  topicId: string | null,
  projectState: string
): RecommendedProject[] {
  if (!topicId) return []

  return (projects as Project[])
    .filter((p) => p.topicId === topicId && p.state === projectState)
    .map((project) => {
      return {
        project,
        score: 1,
        relevance: `${project.state} • ${project.studentId}`,
      }
    })
    .sort((a, b) => {
      const dateA = new Date(a.project.updatedAt).getTime()
      const dateB = new Date(b.project.updatedAt).getTime()
      return dateB - dateA
    })
    .slice(0, 3)
}

/**
 * Recommend job topics for apply_jobs stage
 */
function recommendJobTopics(fieldIds: string[]): RecommendedTopic[] {
  return (topics as Topic[])
    .filter((t) => t.type === 'job')
    .map((topic) => {
      const fieldMatch = topic.fieldIds.filter((f) => fieldIds.includes(f))
        .length

      const score =
        (fieldMatch > 0 ? 0.5 : 0) +
        (topic.employment === 'yes' ? 0.3 : 0) +
        (topic.employmentType ? 0.2 : 0)

      return {
        topic,
        score,
        relevance:
          fieldMatch > 0
            ? `${fieldMatch} field match • ${topic.employmentType || 'Opportunity'}`
            : topic.employmentType || 'Opportunity',
        employmentSignal: topic.employment,
        similarProjects: [],
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

/**
 * Recommend experts for job search
 */
function recommendExpertsForJobSearch(fieldIds: string[]): RecommendedExpert[] {
  return experts
    .map((expert) => {
      const fieldMatch = expert.fieldIds.filter((f) => fieldIds.includes(f))

      const score =
        (fieldMatch.length > 0 ? 0.5 : 0) +
        (expert.offerInterviews ? 0.3 : 0)

      return {
        expert,
        score,
        relevance:
          expert.offerInterviews && fieldMatch.length > 0
            ? 'Available • Your field'
            : 'Industry contact',
        fieldMatch: fieldMatch.slice(0, 2),
      }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}
