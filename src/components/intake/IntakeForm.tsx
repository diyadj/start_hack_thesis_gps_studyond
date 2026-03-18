import { useState } from 'react'
import { motion } from 'framer-motion'
import { INTAKE, STAGES } from '@/lib/copy'
import { fields } from '@/data'
import type { IntakeData } from '@/store/journeyStore'

interface IntakeFormProps {
  onSubmit: (data: IntakeData) => void
}

export function IntakeForm({ onSubmit }: IntakeFormProps) {
  const [form, setForm] = useState({
    topic: '',
    university: '',
    currentStage: 'orientation',
    deadline: '',
    degree: 'msc' as IntakeData['degree'],
    fieldIds: [] as string[],
  })

  function toggleField(id: string) {
    setForm((prev) => ({
      ...prev,
      fieldIds: prev.fieldIds.includes(id)
        ? prev.fieldIds.filter((f) => f !== id)
        : [...prev.fieldIds, id],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.deadline) return
    onSubmit(form)
  }

  const isValid = form.deadline.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex items-start justify-center px-4 py-16"
    >
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-10">
          <p className="ds-label text-muted-foreground mb-2">Studyond — Thesis GPS</p>
          <h1 className="ds-title-lg mb-3">{INTAKE.title}</h1>
          <p className="ds-body text-muted-foreground">{INTAKE.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic */}
          <div>
            <label className="ds-label block mb-1.5">{INTAKE.topicLabel}</label>
            <input
              type="text"
              value={form.topic}
              onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
              placeholder={INTAKE.topicPlaceholder}
              className="w-full border border-border rounded-xl px-4 py-3 ds-body bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="ds-caption text-muted-foreground mt-1.5">{INTAKE.topicHint}</p>
          </div>

          {/* University + Degree */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="ds-label block mb-1.5">{INTAKE.universityLabel}</label>
              <input
                type="text"
                value={form.university}
                onChange={(e) => setForm((p) => ({ ...p, university: e.target.value }))}
                placeholder={INTAKE.universityPlaceholder}
                className="w-full border border-border rounded-xl px-4 py-3 ds-body bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="ds-label block mb-1.5">Degree level</label>
              <select
                value={form.degree}
                onChange={(e) => setForm((p) => ({ ...p, degree: e.target.value as IntakeData['degree'] }))}
                className="w-full border border-border rounded-xl px-4 py-3 ds-body bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="bsc">Bachelor (BSc)</option>
                <option value="msc">Master (MSc)</option>
                <option value="phd">PhD</option>
              </select>
            </div>
          </div>

          {/* Current Stage */}
          <div>
            <label className="ds-label block mb-2">{INTAKE.stageLabel}</label>
            <div className="grid grid-cols-1 gap-2">
              {STAGES.map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, currentStage: stage.id }))}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 ${
                    form.currentStage === stage.id
                      ? 'border-foreground bg-secondary'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <span className="text-lg">{stage.icon}</span>
                  <div>
                    <p className="ds-label">{stage.shortLabel}</p>
                    <p className="ds-caption text-muted-foreground">{stage.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div>
            <label className="ds-label block mb-2">Your fields of study</label>
            <div className="flex flex-wrap gap-2">
              {fields.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleField(f.id)}
                  className={`px-3 py-1.5 rounded-full border ds-small transition-all duration-150 ${
                    form.fieldIds.includes(f.id)
                      ? 'border-foreground bg-foreground text-primary-foreground'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="ds-label block mb-1.5">{INTAKE.deadlineLabel}</label>
            <input
              type="date"
              required
              value={form.deadline}
              onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
              className="w-full border border-border rounded-xl px-4 py-3 ds-body bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid}
            className="w-full bg-foreground text-primary-foreground rounded-full py-4 ds-label font-medium transition-opacity duration-150 disabled:opacity-40 hover:opacity-85"
          >
            {INTAKE.submitButton}
          </button>
        </form>
      </div>
    </motion.div>
  )
}
