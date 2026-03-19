import { useState, useEffect, useRef } from 'react'
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

// Sidebar theme (mirrors T)
const S = {
  bg:          '#ffffff',
  cardBg:      '#f8fafc',
  border:      '#e2e8f0',
  cyan:        '#2563eb',
  cyanMuted:   '#3b82f6',
  text:        '#1e293b',
  muted:       '#94a3b8',
  hover:       '#eff6ff',
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
          className="flex flex-col flex-shrink-0 overflow-y-auto scrollbar-hide"
          style={{ width: 260, background: S.bg, borderRight: `1px solid ${S.border}`, fontFamily: "'Courier New', Courier, monospace" }}
        >
          {/* Header */}
          <div className="px-5 pt-6 pb-4" style={{ borderBottom: `1px solid ${S.border}` }}>
            <div className="flex items-center gap-2 mb-1">
              <Compass size={16} color={S.cyan} strokeWidth={2} />
              <span className="font-bold text-sm" style={{ color: S.cyan, letterSpacing: '0.18em' }}>NAVIGATOR</span>
            </div>
            <span className="text-xs" style={{ color: S.muted, letterSpacing: '0.12em' }}>&gt; THESIS_GPS_ACTIVE</span>
          </div>

          {/* Global Progress */}
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: S.muted, letterSpacing: '0.14em' }}>GLOBAL PROGRESS</span>
              <span className="text-sm font-bold" style={{ color: S.cyan, letterSpacing: '0.05em' }}>{pct}%</span>
            </div>
            <div style={{ height: 4, background: S.border, borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', background: S.cyan, borderRadius: 2 }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: S.muted, letterSpacing: '0.1em' }}>
              EST. COMPLETION: {Math.max(1, Math.round(weeksLeft / 4))} MONTHS
            </p>
          </div>

          {/* Current Phase */}
          {activeStage && (() => {
            const activeMeta = STAGES.find((s) => s.id === activeStage.id)
            return (
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
                <p className="text-xs mb-3" style={{ color: S.muted, letterSpacing: '0.14em' }}>CURRENT PHASE</p>
                <div className="p-3" style={{ background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 4 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ width: 8, height: 8, borderRadius: '50%', background: S.cyan, flexShrink: 0 }}
                    />
                    <span className="text-sm font-bold" style={{ color: S.text, letterSpacing: '0.05em' }}>
                      {activeMeta?.label ?? activeStage.id}
                    </span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: S.muted, lineHeight: 1.5 }}>
                    {activeMeta?.description ?? ''}
                  </p>
                  <button
                    onClick={() => setSelectedStageId(activeStage.id)}
                    className="w-full text-xs py-2 font-bold transition-colors"
                    style={{ background: 'transparent', border: `1px solid ${S.cyan}`, color: S.cyan, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.14em', borderRadius: 2 }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = S.cyanMuted + '33' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    VIEW DETAILS
                  </button>
                </div>
              </div>
            )
          })()}

          {/* Milestones */}
          <div className="px-5 py-4 flex-1">
            <p className="text-xs mb-3" style={{ color: S.muted, letterSpacing: '0.14em' }}>MILESTONES</p>
            <div className="space-y-1">
              {stages.map((st, i) => {
                const meta   = STAGES.find((s) => s.id === st.id)
                const isDone = st.status === 'done'
                const isAct  = st.status === 'active'
                const isLocked = st.status === 'not_started'
                return (
                  <motion.div
                    key={st.id}
                    custom={i}
                    variants={sidebarItem}
                    initial="hidden"
                    animate="visible"
                    onClick={() => setSelectedStageId((prev) => prev === st.id ? null : st.id)}
                    className="flex items-start gap-3 px-2 py-2 rounded cursor-pointer transition-colors"
                    style={{ background: selectedStageId === st.id ? S.hover : 'transparent' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = S.hover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = selectedStageId === st.id ? S.hover : 'transparent' }}
                  >
                    {/* Icon */}
                    <div style={{ flexShrink: 0, marginTop: 1 }}>
                      {isDone ? (
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: S.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={11} color={S.bg} strokeWidth={3} />
                        </div>
                      ) : isAct ? (
                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${S.cyan}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: S.cyan }} />
                        </div>
                      ) : (
                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${S.border}` }} />
                      )}
                    </div>
                    {/* Label */}
                    <div>
                      <p className="text-xs" style={{
                        color: isAct ? S.text : isDone ? S.muted : S.muted,
                        fontWeight: isAct ? 'bold' : 'normal',
                        textDecoration: isDone ? 'line-through' : 'none',
                        letterSpacing: '0.05em',
                      }}>
                        {meta?.label ?? st.id}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: isAct ? S.cyan : S.muted, letterSpacing: '0.1em', fontSize: 10 }}>
                        {isAct ? '> ACTIVE_NODE' : isDone ? 'COMPLETED' : 'LOCKED'}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Bottom */}
          <div className="px-5 py-4" style={{ borderTop: `1px solid ${S.border}` }}>
            <button
              onClick={resetJourney}
              className="w-full text-xs py-1.5 px-3 text-left flex items-center gap-2 transition-colors"
              style={{ color: S.muted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1em' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = S.cyan }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = S.muted }}
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

// ── Topographic node map ───────────────────────────────────────────

function NodeMap({ stages, onSelect }: { stages: StageState[]; onSelect: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ w: 800, h: 500 })
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const dragRef = useRef<{ id: string; startX: number; startY: number; baseX: number; baseY: number } | null>(null)
  const didDrag = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.offsetWidth, h = el.offsetHeight
      setContainerSize({ w, h })
      setPositions(prev => {
        const next: Record<string, { x: number; y: number }> = {}
        NODE_POSITIONS.forEach(n => {
          // keep user-dragged positions; only init missing ones
          next[n.id] = prev[n.id] ?? { x: (n.x / 240) * w, y: (n.y / 150) * h }
        })
        return next
      })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const stageStatusMap: Record<string, string> = {}
  stages.forEach((s) => { stageStatusMap[s.id] = s.status })

  const points = NODE_POSITIONS.map((n) => ({
    ...n,
    status: stageStatusMap[n.id] ?? 'not_started',
    pos: positions[n.id] ?? { x: (n.x / 240) * containerSize.w, y: (n.y / 150) * containerSize.h },
  }))

  const segments = points.slice(0, -1).flatMap((from, i) => {
    if (from.status !== 'done') return []
    const to   = points[i + 1]
    const cp1x = from.pos.x + (to.pos.x - from.pos.x) * 0.45
    const cp2x = to.pos.x   - (to.pos.x - from.pos.x) * 0.45
    return [`M ${from.pos.x} ${from.pos.y} C ${cp1x} ${from.pos.y}, ${cp2x} ${to.pos.y}, ${to.pos.x} ${to.pos.y}`]
  })

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>, id: string) {
    e.currentTarget.setPointerCapture(e.pointerId)
    e.stopPropagation()
    didDrag.current = false
    const pos = positions[id] ?? { x: 0, y: 0 }
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, baseX: pos.x, baseY: pos.y }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!dragRef.current) return
    const { id, startX, startY, baseX, baseY } = dragRef.current
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true
    setPositions(prev => ({ ...prev, [id]: { x: baseX + dx, y: baseY + dy } }))
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>, id: string) {
    e.stopPropagation()
    dragRef.current = null
    if (!didDrag.current) onSelect(id)
    didDrag.current = false
  }

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ padding: 32 }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%', height: '100%',
          border: `1px solid ${T.border}`,
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
        }}
      >
        {/* Background + map image */}
        <div style={{ position: 'absolute', inset: 0, background: '#F3F5F6' }} />
        <img
          src={mapImage} alt="topographic map" draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.35, position: 'relative' }}
        />

        {/* SVG lines — pixel coords matching container size */}
        <svg
          viewBox={`0 0 ${containerSize.w} ${containerSize.h}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          {segments.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={T.accent} strokeWidth="2" opacity={0.5} />
          ))}
        </svg>

        {/* Draggable nodes */}
        {points.map((p) => {
          const isDone = p.status === 'done'
          const isAct  = p.status === 'active'
          const Icon   = STAGE_ICONS[p.id as StageId]
          return (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: p.pos.x,
                top:  p.pos.y,
                transform: 'translate(-50%, -50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                userSelect: 'none',
              }}
            >
              <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                onPointerDown={(e) => handlePointerDown(e, p.id)}
                onPointerMove={handlePointerMove}
                onPointerUp={(e) => handlePointerUp(e, p.id)}
                style={{
                  width: 40, height: 40,
                  background: isAct ? T.accent : isDone ? T.accentMuted : T.terminalBg,
                  border: `2px solid ${isAct ? T.accent : isDone ? T.accentMuted : T.border}`,
                  borderRadius: 5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'grab',
                  touchAction: 'none',
                  boxShadow: isAct
                    ? `0 0 0 5px ${T.accent}28, 0 2px 10px rgba(0,0,0,0.18)`
                    : '0 1px 6px rgba(0,0,0,0.14)',
                  opacity: isAct ? 1 : isDone ? 0.9 : 0.55,
                }}
              >
                {isDone
                  ? <Check size={17} color="#fff" strokeWidth={2.5} />
                  : <Icon  size={17} color={isAct ? '#fff' : T.userMuted} strokeWidth={2} />
                }
              </motion.button>
              <span style={{
                fontSize: 9, letterSpacing: '0.08em',
                color: isAct ? T.accent : isDone ? T.accentMuted : T.userMuted,
                opacity: isAct ? 1 : isDone ? 0.7 : 0.45,
                fontFamily: "'Courier New', monospace",
                pointerEvents: 'none',
                background: 'rgba(240,244,248,0.75)',
                padding: '1px 4px',
              }}>
                {p.stageName}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
