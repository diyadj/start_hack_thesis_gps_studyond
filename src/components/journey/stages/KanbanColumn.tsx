export function KanbanColumn({
  title,
  items,
  borderColor,
  textColor,
  mutedColor,
}: {
  title: string
  items: Array<{ id: string; stageLabel: string; text: string }>
  borderColor: string
  textColor: string
  mutedColor: string
}) {
  return (
    <div className="rounded-lg p-3" style={{ border: `1px solid ${borderColor}`, backgroundColor: '#FFFFFF' }}>
      <p className="ds-small font-semibold" style={{ color: textColor }}>{title}</p>
      <div className="mt-2 space-y-2">
        {items.slice(0, 6).map((item) => (
          <article key={item.id} className="rounded p-2" style={{ border: `1px solid ${borderColor}`, backgroundColor: '#FAFAFA' }}>
            <p className="ds-caption" style={{ color: mutedColor }}>{item.stageLabel}</p>
            <p className="ds-small" style={{ color: textColor }}>{item.text}</p>
          </article>
        ))}
        {items.length === 0 && (
          <p className="ds-caption" style={{ color: mutedColor }}>No items in this column.</p>
        )}
      </div>
    </div>
  )
}
