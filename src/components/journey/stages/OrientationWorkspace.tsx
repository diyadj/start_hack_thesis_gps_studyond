interface OrientationWorkspaceProps {
  recommendations: Array<{
    topic: { id: string; title: string; description: string; employment?: 'yes' | 'no' | 'open' }
    relevance: string
    employmentSignal?: 'yes' | 'no' | 'open'
  }>
  borderColor: string
  textColor: string
  mutedColor: string
}

export function OrientationWorkspace({
  recommendations,
  borderColor,
  textColor,
  mutedColor,
}: OrientationWorkspaceProps) {
  return (
    <div className="space-y-3">
      <p className="ds-label font-semibold" style={{ color: textColor }}>Recommended Topics</p>
      <div className="grid gap-3 md:grid-cols-2">
        {recommendations.slice(0, 6).map((rec) => (
          <article
            key={rec.topic.id}
            className="rounded-lg p-3"
            style={{ border: `1px solid ${borderColor}`, backgroundColor: '#FFFFFF' }}
          >
            <p className="ds-small font-semibold" style={{ color: textColor }}>{rec.topic.title}</p>
            <p className="ds-caption mt-1" style={{ color: mutedColor }}>
              {rec.topic.description.slice(0, 140)}...
            </p>
            <p className="ds-caption mt-2" style={{ color: mutedColor }}>{rec.relevance}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
