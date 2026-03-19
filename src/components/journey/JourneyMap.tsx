import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Compass, User, Calendar, Zap, PenLine, Check } from 'lucide-react'
import { STAGES, JOURNEY, URGENCY_MESSAGES } from '@/lib/copy'
import { weeksUntil, getUrgency } from '@/lib/utils'
import { useJourneyStore, type StageState } from '@/store/journeyStore'
import mapImage from '@/assets/map.png'

type StageId = 'orientation' | 'supervisor' | 'planning' | 'execution' | 'writing'

const STAGE_ICONS: Record<StageId, React.ElementType> = {
  orientation: Compass,
  supervisor:  User,
  planning:    Calendar,
  execution:   Zap,
  writing:     PenLine,
}

interface JourneyMapProps {
  onStuck: (stageId: string) => void
}

// Color theme
const T = {
  pageBg:      '#f0f4f8',
  terminalBg:  '#ffffff',
  barBg:       '#ffffff',
  border:      '#e2e8f0',
  accent:      '#2563eb',
  accentMuted: '#3b82f6',
  userMuted:   '#94a3b8',
  hoverBg:     '#eff6ff',
  selectedBg:  'rgba(37,99,235,0.08)',
  danger:      '#dc2626',
  warn:        '#d97706',
}

const STAGE_TASKS: Record<string, string[]> = {
  orientation: ['Define research question', 'Review literature scope', 'Align with advisor interests'],
  supervisor:  ['Review publications list (2022–2024)', 'Map project scope to lab resources', 'Draft initial outreach communication'],
  planning:    ['Draft methodology outline', 'Create project timeline', 'Confirm company partner alignment'],
  execution:   ['Conduct expert interviews', 'Collect & clean dataset', 'Iterate on findings with advisor'],
  writing:     ['Draft introduction & conclusion', 'Peer review round', 'Final formatting & citation check'],
}

// Node positions in the SVG coordinate space (viewBox 0 0 240 150)
const NODE_POSITIONS = [
  { id: 'orientation', x: 40,  y: 115, label: 'NODE_ORIENT', stageName: 'ORIENTATION' },
  { id: 'supervisor',  x: 90,  y: 72,  label: 'NODE_SUPV',   stageName: 'SUPERVISOR'  },
  { id: 'planning',    x: 130, y: 95,  label: 'NODE_PLAN',   stageName: 'PLANNING'    },
  { id: 'execution',   x: 178, y: 52,  label: 'NODE_EXEC',   stageName: 'EXECUTION'   },
  { id: 'writing',     x: 215, y: 85,  label: 'NODE_WRITE',  stageName: 'WRITING'     },
]


const sidebarItem = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.07, duration: 0.3, ease: 'easeOut' },
  }),
}

const cardVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:   { opacity: 0, x: -20, transition: { duration: 0.2 } },
}

export function JourneyMap({ onStuck }: JourneyMapProps) {
  const { intake, stages, markStageDone, resetJourney } = useJourneyStore()
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({})
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)

  if (!intake) return null

  const weeksLeft     = weeksUntil(intake.deadline)
  const urgency       = getUrgency(weeksLeft)
  const activeStage   = stages.find((s) => s.status === 'active')
  const doneCount     = stages.filter((s) => s.status === 'done').length
  const pct           = Math.round((doneCount / stages.length) * 100)
  const selectedStage = selectedStageId ? stages.find((s) => s.id === selectedStageId) ?? null : null
  const selectedMeta  = selectedStage ? STAGES.find((s) => s.id === selectedStage.id) ?? null : null
  const selectedIndex = selectedStage ? stages.findIndex((s) => s.id === selectedStage.id) : 0
  const tasks         = selectedStage ? (STAGE_TASKS[selectedStage.id] ?? []) : []
  const isActiveSelected = selectedStage?.status === 'active'

  function toggleTask(key: string) {
    setCheckedTasks((p) => ({ ...p, [key]: !p[key] }))
  }

  const urgencyColor = urgency === 'urgent' ? T.danger : urgency === 'moderate' ? T.warn : T.accentMuted

  return (
    <div
      className="flex flex-col"
      style={{ height: '100vh', background: T.pageBg, fontFamily: "'Courier New', Courier, monospace" }}
    >
      {/* ── Top bar ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between px-5 py-2 flex-shrink-0"
        style={{ background: T.barBg, borderBottom: `1px solid ${T.border}` }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: T.accent, fontSize: 12 }}>▣</span>
          <span className="text-xs" style={{ color: T.accent, letterSpacing: '0.18em' }}>
            THESIS_GPS // MAIN_MAP
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs" style={{ color: T.accentMuted, letterSpacing: '0.1em' }}>
            {intake.topic ? `"${intake.topic.slice(0, 32)}${intake.topic.length > 32 ? '…' : ''}"` : ''}
          </span>
          <button
            onClick={resetJourney}
            className="text-xs px-2 py-0.5 transition-colors"
            style={{ color: T.userMuted, border: `1px solid ${T.border}`, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1em' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.hoverBg }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            [RESET]
          </button>
        </div>
      </motion.div>

      {/* ── Body: sidebar + main ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Sidebar ── */}
        <div
          className="flex flex-col flex-shrink-0"
          style={{ width: 220, background: T.barBg, borderRight: `1px solid ${T.border}` }}
        >
          {/* Navigator header */}
          <div className="px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${T.border}` }}>
            <p className="text-xs font-bold" style={{ color: T.accent, letterSpacing: '0.15em' }}>
              NAVIGATOR_CORE
            </p>
            <p className="text-xs mt-1" style={{ color: urgencyColor, letterSpacing: '0.12em' }}>
              {pct}%_COMPLETE
            </p>
          </div>

          {/* Stage list */}
          <div className="flex-1 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
            {stages.map((st, i) => {
              const meta   = STAGES.find((s) => s.id === st.id)
              const isDone = st.status === 'done'
              const isAct  = st.status === 'active'
              return (
                <motion.div
                  key={st.id}
                  custom={i}
                  variants={sidebarItem}
                  initial="hidden"
                  animate="visible"
                  onClick={() => setSelectedStageId((prev) => prev === st.id ? null : st.id)}
                  className="flex items-center gap-2 px-4 py-2 text-xs"
                  style={{
                    borderLeft: isAct ? `3px solid ${T.accent}` : selectedStageId === st.id ? `3px solid ${T.accentMuted}` : '3px solid transparent',
                    color: isDone ? T.userMuted : isAct ? T.accent : T.userMuted,
                    opacity: isDone ? 0.65 : isAct ? 1 : 0.55,
                    letterSpacing: '0.12em',
                    fontWeight: isAct ? 'bold' : 'normal',
                    cursor: 'pointer',
                    background: selectedStageId === st.id ? T.selectedBg : 'transparent',
                  }}
                  onMouseEnter={(e) => { if (selectedStageId !== st.id) (e.currentTarget as HTMLElement).style.background = T.hoverBg }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = selectedStageId === st.id ? T.selectedBg : 'transparent' }}
                >
                  <span style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, background: isDone ? T.accentMuted : isAct ? T.accent : T.border }}>
                    {isDone
                      ? <Check size={11} color="#fff" strokeWidth={2.5} />
                      : (() => { const Icon = STAGE_ICONS[st.id as StageId]; return <Icon size={11} color={isAct ? '#fff' : T.userMuted} strokeWidth={2} /> })()
                    }
                  </span>
                  <span>{meta?.shortLabel?.toUpperCase() ?? st.id.toUpperCase()}</span>
                </motion.div>
              )
            })}
          </div>

          {/* Bottom buttons */}
          <div className="px-4 py-4 space-y-2" style={{ borderTop: `1px solid ${T.border}` }}>
            <button
              className="w-full text-xs py-2 px-3 text-left transition-colors"
              style={{ border: `1px solid ${T.border}`, color: T.accent, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1em' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.hoverBg }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              [GENERATE_REPORT]
            </button>
            <button
              onClick={resetJourney}
              className="w-full text-xs py-1.5 px-3 text-left flex items-center gap-2 transition-colors"
              style={{ color: T.userMuted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1em' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = T.accent }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = T.userMuted }}
            >
              <span>⚙</span><span>SETTINGS</span>
            </button>
          </div>
        </div>

        {/* ── Main area ── */}
        <div className="flex-1 relative overflow-hidden">

          {/* Draggable topographic node map */}
          <NodeMap stages={stages} onSelect={setSelectedStageId} />

          {/* Stage detail card — opens when a sidebar item is clicked */}
          <div className="absolute inset-0 flex items-center justify-start p-8 pointer-events-none">
            <AnimatePresence mode="wait">
              {selectedMeta && selectedStage && (
                <motion.div
                  key={selectedStage.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="pointer-events-auto scrollbar-hide"
                  style={{
                    width: 380,
                    maxHeight: 'calc(100vh - 120px)',
                    overflowY: 'auto',
                    background: T.terminalBg,
                    border: `1px solid ${T.border}`,
                    borderRadius: 2,
                  }}
                >
                  {/* Card header */}
                  <div
                    className="flex items-center justify-between px-4 py-2"
                    style={{ background: T.barBg, borderBottom: `1px solid ${T.border}` }}
                  >
                    <span className="text-xs" style={{ color: urgencyColor, letterSpacing: '0.15em' }}>
                      COORD_{selectedIndex + 1}N_{weeksLeft}W
                    </span>
                    <div className="flex items-center gap-3">
                      {isActiveSelected && (
                        <motion.div
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          style={{ width: 10, height: 10, background: T.accent, borderRadius: 2 }}
                        />
                      )}
                      <button
                        onClick={() => setSelectedStageId(null)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          color: T.userMuted,
                          fontSize: 13,
                          lineHeight: 1,
                          padding: '0 2px',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = T.accent }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = T.userMuted }}
                      >
                        [×]
                      </button>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-5 space-y-4">
                    {/* Stage title */}
                    <div>
                      <p className="text-xs mb-1" style={{ color: T.accentMuted, letterSpacing: '0.15em' }}>
                        SYSTEM
                      </p>
                      <h2
                        className="font-bold uppercase"
                        style={{ color: T.accent, fontSize: 18, letterSpacing: '0.1em' }}
                      >
                        &gt; {selectedMeta.label}
                      </h2>
                      <p className="text-xs mt-1" style={{ color: T.userMuted }}>
                        {selectedMeta.description}
                      </p>
                    </div>

                    {/* Timeline info */}
                    <div
                      className="px-3 py-2"
                      style={{ borderLeft: `3px solid ${urgencyColor}`, background: T.selectedBg }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: T.accentMuted, letterSpacing: '0.12em' }}>
                          TIMELINE_ANALYSIS
                        </span>
                        <span className="text-xs font-bold" style={{ color: urgencyColor, letterSpacing: '0.1em' }}>
                          {weeksLeft}W LEFT
                        </span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: T.userMuted }}>
                        {urgency === 'urgent'
                          ? URGENCY_MESSAGES.urgent
                          : urgency === 'moderate'
                          ? URGENCY_MESSAGES.moderate
                          : URGENCY_MESSAGES.calm}
                      </p>
                    </div>

                    {/* Pending operations */}
                    <div>
                      <p className="text-xs mb-2" style={{ color: T.accentMuted, letterSpacing: '0.15em' }}>
                        PENDING_OPERATIONS
                      </p>
                      <div className="space-y-2">
                        {tasks.map((task, ti) => {
                          const key     = `${selectedStage.id}-${ti}`
                          const checked = checkedTasks[key] ?? false
                          const status  = checked ? 'COMPLETED' : ti === 0 ? 'IN_PROGRESS' : 'PENDING'
                          return (
                            <button
                              key={key}
                              onClick={() => toggleTask(key)}
                              className="w-full text-left flex items-start gap-2 text-xs transition-colors"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                color: checked ? T.userMuted : T.accentMuted,
                                opacity: checked ? 0.55 : 1,
                              }}
                            >
                              <span style={{ flexShrink: 0, color: checked ? T.accentMuted : T.accent }}>
                                {checked ? '[✓]' : '[ ]'}
                              </span>
                              <span>
                                <span style={{ textDecoration: checked ? 'line-through' : 'none' }}>
                                  {task}
                                </span>
                                <br />
                                <span style={{ color: T.userMuted, letterSpacing: '0.1em', fontSize: 10 }}>
                                  STATUS: {status}
                                </span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Metrics row */}
                    <div className="flex gap-6" style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                      <div>
                        <p className="text-xs" style={{ color: T.userMuted, letterSpacing: '0.1em' }}>
                          WEEKS_REMAINING
                        </p>
                        <p className="text-sm font-bold" style={{ color: urgencyColor, letterSpacing: '0.05em' }}>
                          ~{weeksLeft} WEEKS
                        </p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: T.userMuted, letterSpacing: '0.1em' }}>
                          STAGE
                        </p>
                        <p className="text-sm font-bold" style={{ color: T.accent, letterSpacing: '0.05em' }}>
                          {selectedIndex + 1}_OF_{stages.length}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons — only for the current active stage */}
                    {isActiveSelected && activeStage && (
                      <div className="flex gap-2 flex-wrap">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => { markStageDone(activeStage.id); setSelectedStageId(null) }}
                          className="flex-1 text-xs py-2 px-3 font-bold transition-colors"
                          style={{
                            background: T.accent,
                            color: T.pageBg,
                            border: `1px solid ${T.accent}`,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            letterSpacing: '0.12em',
                          }}
                        >
                          {JOURNEY.markDoneButton.toUpperCase()}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03, backgroundColor: T.hoverBg }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => onStuck(activeStage.id)}
                          className="flex-1 text-xs py-2 px-3 transition-colors"
                          style={{
                            background: 'transparent',
                            color: T.accentMuted,
                            border: `1px solid ${T.border}`,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            letterSpacing: '0.12em',
                          }}
                        >
                          {JOURNEY.stuckButton.toUpperCase()}
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom system log bar */}
          <div
            className="absolute bottom-0 right-0 flex gap-6 px-5 py-2 text-xs"
            style={{ color: T.userMuted, background: 'transparent', letterSpacing: '0.1em', pointerEvents: 'none' }}
          >
            <span>
              <span style={{ color: T.accentMuted }}>SYSTEM_LOG:</span> {activeStage ? `PROCESSING_${activeStage.id.toUpperCase()}` : 'ALL_STAGES_COMPLETE'}
            </span>
            <span>
              <span style={{ color: T.accentMuted }}>NETWORK:</span> CONNECTED_TO_EDU_GRID_01
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Draggable topographic node map ───────────────────────────────────────────

function NodeMap({ stages, onSelect }: { stages: StageState[]; onSelect: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging   = useRef(false)
  const [constraints, setConstraints] = useState({ left: -700, right: 0, top: -350, bottom: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    setConstraints({
      left:  -(el.offsetWidth  * 0.62),
      right:  0,
      top:   -(el.offsetHeight * 0.62),
      bottom: 0,
    })
  }, [])

  const stageStatusMap: Record<string, string> = {}
  stages.forEach((s) => { stageStatusMap[s.id] = s.status })

  const points = NODE_POSITIONS.map((n) => ({ ...n, status: stageStatusMap[n.id] ?? 'not_started' }))

  // Build individual bezier segments — only between consecutive done nodes
  const segments = points.slice(0, -1).flatMap((from, i) => {
    if (from.status !== 'done') return []
    const to   = points[i + 1]
    const cp1x = from.x + (to.x - from.x) * 0.45
    const cp2x = to.x   - (to.x - from.x) * 0.45
    return [`M ${from.x} ${from.y} C ${cp1x} ${from.y}, ${cp2x} ${to.y}, ${to.x} ${to.y}`]
  })

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" style={{ cursor: 'grab' }}>
      <motion.div
        drag
        dragConstraints={constraints}
        dragElastic={0.06}
        onDragStart={() => { isDragging.current = true }}
        onDragEnd={()   => { setTimeout(() => { isDragging.current = false }, 50) }}
        whileDrag={{ cursor: 'grabbing' }}
        style={{ width: '162%', height: '162%', position: 'absolute', top: 0, left: 0 }}
      >
        {/* Topographic map image — framed */}
        <div style={{
          position: 'absolute', inset: 0, margin: 32,
          border: `1px solid ${T.border}`, borderRadius: 4,
          overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          <img
            src={mapImage} alt="topographic map" draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.9 }}
          />
        </div>

        {/* SVG — only the done route segments */}
        <svg
          viewBox="0 0 240 150"
          preserveAspectRatio="xMinYMin meet"
          style={{ width: '100%', height: '100%', display: 'block', position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {segments.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={T.accent} strokeWidth="0.6" opacity={0.5} />
          ))}
        </svg>

        {/* Node squares — HTML buttons positioned over the map */}
        {points.map((p) => {
          const isDone = p.status === 'done'
          const isAct  = p.status === 'active'
          const Icon   = STAGE_ICONS[p.id as StageId]
          return (
            <div key={p.id} style={{
              position: 'absolute',
              left: `${(p.x / 240) * 100}%`,
              top:  `${(p.y / 150) * 100}%`,
              transform: 'translate(-50%, -50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { if (!isDragging.current) onSelect(p.id) }}
                style={{
                  width: 28, height: 28,
                  background: isAct ? T.accent : isDone ? T.accentMuted : T.terminalBg,
                  border: `1.5px solid ${isAct ? T.accent : isDone ? T.accentMuted : T.border}`,
                  borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: isAct
                    ? `0 0 0 4px ${T.accent}28, 0 2px 8px rgba(0,0,0,0.15)`
                    : '0 1px 4px rgba(0,0,0,0.12)',
                  opacity: isAct ? 1 : isDone ? 0.9 : 0.5,
                }}
              >
                {isDone
                  ? <Check size={13} color="#fff" strokeWidth={2.5} />
                  : <Icon  size={13} color={isAct ? '#fff' : T.userMuted} strokeWidth={2} />
                }
              </motion.button>
              <span style={{
                fontSize: 8, letterSpacing: '0.08em',
                color: isAct ? T.accent : isDone ? T.accentMuted : T.userMuted,
                opacity: isAct ? 1 : isDone ? 0.7 : 0.4,
                fontFamily: "'Courier New', monospace",
                pointerEvents: 'none',
              }}>
                {p.stageName}
              </span>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
