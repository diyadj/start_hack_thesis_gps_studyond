import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ACTION_CARD_PROMPT, SYSTEM_PROMPT_BASE } from '@/lib/prompts'

interface ActionCardProps {
  stage: string
  topic: string
  university: string
  deadline: string
  weeksLeft: number
  urgency: 'calm' | 'moderate' | 'urgent'
}

export function ActionCard({ stage, topic, university, deadline, weeksLeft, urgency }: ActionCardProps) {
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const prompt = useMemo(
    () => ACTION_CARD_PROMPT({ stage, topic, university, deadline, weeksLeft, urgency }),
    [deadline, stage, topic, university, urgency, weeksLeft]
  )

  useEffect(() => {
    let cancelled = false

    async function generateAction() {
      if (!deadline) {
        setResponse(null)
        return
      }

      setLoading(true)
      setError(null)
      setResponse(null)

      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 220,
            system: SYSTEM_PROMPT_BASE,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          }),
        })

        const data = await res.json()
        const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? ''

        if (!cancelled) {
          setResponse(text.trim() || null)
        }
      } catch {
        if (!cancelled) {
          setError('Could not generate your next action right now.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    generateAction()

    return () => {
      cancelled = true
    }
  }, [prompt, deadline])

  if (!loading && !response && !error) {
    return null
  }

  return (
    <div className="border border-ai rounded-xl p-4 bg-blue-50/40">
      <p className="ds-caption text-ai mb-2 font-medium">What to do right now</p>

      {loading && (
        <div className="space-y-3" aria-live="polite" aria-busy="true">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="ds-small">Planning your next move...</span>
          </div>
          <div className="h-3 w-5/6 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-4/5 rounded bg-muted" />
        </div>
      )}

      {!loading && response && (
        <p className="ds-small whitespace-pre-wrap text-foreground">{response}</p>
      )}

      {!loading && error && (
        <p className="ds-small text-destructive">{error}</p>
      )}
    </div>
  )
}
