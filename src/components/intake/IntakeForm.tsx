import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { STAGES } from '@/lib/copy'
import { fields } from '@/data'
import type { IntakeData } from '@/store/journeyStore'

interface IntakeFormProps {
  onSubmit: (data: IntakeData) => void
}

type FormData = {
  degree: IntakeData['degree']
  topic: string
  university: string
  currentStage: string
  fieldIds: string[]
  deadline: string
}

const STEPS = [
  {
    id: 'degree' as const,
    system: 'Target academic level detected. Confirm degree type.',
    type: 'select' as const,
    options: [
      { value: 'bsc', label: 'Bachelor (BSc)' },
      { value: 'msc', label: 'Master (MSc)' },
      { value: 'phd', label: 'PhD' },
    ],
  },
  {
    id: 'topic' as const,
    system: 'What is your primary research domain?',
    type: 'text' as const,
    options: undefined,
  },
  {
    id: 'university' as const,
    system: 'Which university are you enrolled at?',
    type: 'text' as const,
    options: undefined,
  },
  {
    id: 'currentStage' as const,
    system: 'Select your current thesis stage.',
    type: 'select' as const,
    options: STAGES.map((s) => ({ value: s.id, label: s.label })),
  },
  {
    id: 'fieldIds' as const,
    system: 'Select your fields of study. Press [CONFIRM] when done.',
    type: 'multiselect' as const,
    options: fields.map((f) => ({ value: f.id, label: f.name })),
  },
  {
    id: 'deadline' as const,
    system: 'Set your thesis submission deadline.',
    type: 'date' as const,
    options: undefined,
  },
]

// Framer Motion variants
const msgVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

const optionContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}

const optionVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
}

export function IntakeForm({ onSubmit }: IntakeFormProps) {
  const [step, setStep] = useState(0)
  const [history, setHistory] = useState<Array<{ system: string; user: string }>>([])
  const [inputValue, setInputValue] = useState('')
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [form, setForm] = useState<FormData>({
    degree: 'msc',
    topic: '',
    university: '',
    currentStage: 'orientation',
    fieldIds: [],
    deadline: '',
  })

  const inputRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const totalSteps = STEPS.length
  const currentStep = STEPS[step]

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [step])

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [history, step])

  function advanceStep(userAnswer: string, formUpdate: Partial<FormData>) {
    const newForm = { ...form, ...formUpdate }
    setHistory((prev) => [...prev, { system: currentStep.system, user: userAnswer }])
    setForm(newForm)
    setInputValue('')
    setSelectedFields([])

    if (step + 1 >= totalSteps) {
      onSubmit(newForm as IntakeData)
    } else {
      setStep((s) => s + 1)
    }
  }

  function handleTextSubmit() {
    if (!inputValue.trim()) return
    advanceStep(inputValue.trim(), { [currentStep.id]: inputValue.trim() })
  }

  function handleSelectOption(value: string, label: string) {
    advanceStep(label, { [currentStep.id]: value })
  }

  function handleFieldToggle(value: string) {
    setSelectedFields((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  function handleFieldsConfirm() {
    const labels = fields
      .filter((f) => selectedFields.includes(f.id))
      .map((f) => f.name)
      .join(', ')
    advanceStep(labels || '(none selected)', { fieldIds: selectedFields })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      if (currentStep.type === 'text') handleTextSubmit()
      if (currentStep.type === 'date') handleTextSubmit()
      if (currentStep.type === 'multiselect') handleFieldsConfirm()
    }
  }

  // Color theme
  const T = {
    pageBg:        '#f0f4f8',
    terminalBg:    '#ffffff',
    barBg:         '#ffffff',
    border:        '#e2e8f0',
    accent:        '#2563eb',
    accentMuted:   '#3b82f6',
    userText:      '#1e40af',
    userMuted:     '#94a3b8',
    inputText:     '#1e293b',
    titleColor:    '#0f172a',
    subtitleColor: '#2563eb',
    hoverBg:       '#eff6ff',
    selectedBg:    'rgba(37,99,235,0.08)',
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: T.pageBg, fontFamily: "'Courier New', Courier, monospace" }}
    >
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center mb-10"
      >
        <h1
          className="font-bold uppercase mb-2"
          style={{ fontSize: '3rem', color: T.titleColor, letterSpacing: '0.2em' }}
        >
          Thesis GPS
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-sm uppercase"
          style={{ color: T.subtitleColor, letterSpacing: '0.25em' }}
        >
          Your AI Thesis Assistant
        </motion.p>
      </motion.div>

      {/* Terminal window */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        className="w-full max-w-2xl overflow-hidden"
        style={{ border: `1px solid ${T.border}`, borderRadius: '2px', background: T.terminalBg }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ background: T.barBg, borderBottom: `1px solid ${T.border}` }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: T.accent, fontSize: '12px' }}>▣</span>
            <span className="text-xs" style={{ color: T.accent, letterSpacing: '0.2em' }}>
              THESIS_GPS // CALIBRATION_MODE
            </span>
          </div>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '12px', height: '12px', background: T.accent, borderRadius: '2px' }}
          />
        </div>

        {/* Terminal body */}
        <div
          ref={bodyRef}
          className="p-6 space-y-5 overflow-y-auto scrollbar-hide"
          style={{ minHeight: '420px', maxHeight: '520px' }}
        >
          {/* Boot message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="flex items-start gap-3"
          >
            <span style={{ color: T.accentMuted, fontSize: '12px', marginTop: '2px' }}>⊙</span>
            <div>
              <p className="text-xs mb-1" style={{ color: T.accentMuted, letterSpacing: '0.15em' }}>
                SYSTEM
              </p>
              <p className="text-sm" style={{ color: T.accent }}>
                &gt; initializing coordinates...
              </p>
            </div>
          </motion.div>

          {/* Conversation history */}
          <AnimatePresence initial={false}>
            {history.map((entry, i) => (
              <motion.div
                key={i}
                variants={msgVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {/* System line */}
                <div className="flex items-start gap-3">
                  <span style={{ color: T.accentMuted, fontSize: '12px', marginTop: '2px' }}>⊙</span>
                  <div>
                    <p
                      className="text-xs mb-1"
                      style={{ color: T.accentMuted, letterSpacing: '0.15em' }}
                    >
                      SYSTEM
                    </p>
                    <p className="text-sm" style={{ color: T.accent }}>
                      &gt; {entry.system}
                    </p>
                  </div>
                </div>
                {/* User line */}
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="flex justify-end items-start gap-3"
                >
                  <div className="text-right">
                    <p
                      className="text-xs mb-1"
                      style={{ color: T.userMuted, letterSpacing: '0.15em' }}
                    >
                      USER
                    </p>
                    <p className="text-sm" style={{ color: T.userText }}>
                      &gt; {entry.user}
                    </p>
                  </div>
                  <span style={{ color: T.userMuted, fontSize: '12px', marginTop: '2px' }}>○</span>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Current step */}
          <AnimatePresence mode="wait">
            {step < totalSteps && (
              <motion.div
                key={step}
                variants={msgVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                {/* Question */}
                <div className="flex items-start gap-3">
                  <span style={{ color: T.accentMuted, fontSize: '12px', marginTop: '2px' }}>⊙</span>
                  <div>
                    <p
                      className="text-xs mb-1"
                      style={{ color: T.accentMuted, letterSpacing: '0.15em' }}
                    >
                      SYSTEM
                    </p>
                    <p className="text-sm" style={{ color: T.accent }}>
                      &gt; {currentStep.system}
                    </p>
                  </div>
                </div>

                {/* Select options */}
                {currentStep.type === 'select' && (
                  <motion.div
                    className="pl-7 flex flex-wrap gap-2 pt-1"
                    variants={optionContainerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {currentStep.options?.map((opt) => (
                      <motion.button
                        key={opt.value}
                        variants={optionVariants}
                        onClick={() => handleSelectOption(opt.value, opt.label)}
                        whileHover={{ scale: 1.04, backgroundColor: T.hoverBg }}
                        whileTap={{ scale: 0.97 }}
                        className="text-xs px-3 py-1"
                        style={{
                          border: `1px solid ${T.border}`,
                          color: T.accent,
                          background: 'transparent',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        [{opt.label}]
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* Multiselect */}
                {currentStep.type === 'multiselect' && (
                  <motion.div
                    className="pl-7 space-y-3 pt-1"
                    variants={optionContainerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="flex flex-wrap gap-2">
                      {currentStep.options?.map((opt) => {
                        const selected = selectedFields.includes(opt.value)
                        return (
                          <motion.button
                            key={opt.value}
                            variants={optionVariants}
                            onClick={() => handleFieldToggle(opt.value)}
                            whileTap={{ scale: 0.96 }}
                            className="text-xs px-3 py-1 transition-colors duration-150"
                            style={{
                              border: selected ? `1px solid ${T.accent}` : `1px solid ${T.border}`,
                              color: selected ? T.accent : T.userMuted,
                              background: selected ? T.selectedBg : 'transparent',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            {selected ? '[x]' : '[ ]'} {opt.label}
                          </motion.button>
                        )
                      })}
                    </div>
                    <motion.button
                      variants={optionVariants}
                      onClick={handleFieldsConfirm}
                      whileHover={{ backgroundColor: T.hoverBg }}
                      whileTap={{ scale: 0.97 }}
                      className="text-xs px-4 py-1"
                      style={{
                        border: `1px solid ${T.accent}`,
                        color: T.accent,
                        background: 'transparent',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      [CONFIRM]
                    </motion.button>
                  </motion.div>
                )}

                {/* Text / Date input */}
                {(currentStep.type === 'text' || currentStep.type === 'date') && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="pl-7 flex items-center gap-2 pt-1"
                  >
                    <span className="text-sm" style={{ color: T.accent }}>
                      &gt;
                    </span>
                    <input
                      ref={inputRef}
                      type={currentStep.type === 'date' ? 'date' : 'text'}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={currentStep.type === 'date' ? '' : 'type and press Enter...'}
                      className="flex-1 text-sm outline-none pb-0.5"
                      style={{
                        background: 'transparent',
                        color: T.inputText,
                        borderBottom: `1px solid ${T.border}`,
                        fontFamily: 'inherit',
                        caretColor: T.accent,
                      }}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '14px',
                        background: T.accent,
                        flexShrink: 0,
                      }}
                    />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ background: T.barBg, borderTop: `1px solid ${T.border}` }}
        >
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block rounded-full"
              style={{ width: '6px', height: '6px', background: T.accent, flexShrink: 0 }}
            />
            <span className="text-xs" style={{ color: T.accent, letterSpacing: '0.2em' }}>
              AWAITING INPUT
            </span>
          </div>
          <motion.span
            key={step}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xs"
            style={{ color: T.userMuted }}
          >
            Node {Math.min(step + 1, totalSteps)}/{totalSteps}
          </motion.span>
        </div>
      </motion.div>
    </div>
  )
}
