import { motion } from 'framer-motion'
import { Check, Sparkles, User, Users, ChevronLeft, ChevronRight, Layers } from 'lucide-react'
import type { Case, Option } from '../engine/types'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'

interface ScenarioCardProps {
  cases: Case[]
  options: Option[]
  mapping: Record<string, string>
  caseIndex: number
  onMap: (caseId: string, optionId: string) => void
  onSetCaseIndex: (index: number) => void
  onFillAll?: (optionId: string) => void
}

function getCaseIcon(index: number, total: number) {
  if (index === 0) return Sparkles
  if (index === total - 1) return User
  return Users
}

export function ScenarioCard({
  cases,
  options,
  mapping,
  caseIndex,
  onMap,
  onSetCaseIndex,
  onFillAll,
}: ScenarioCardProps) {
  const currentCase = cases[caseIndex] ?? cases[0]
  if (!currentCase) return null

  const selectedOptionId = mapping[currentCase.id]
  const CaseIcon = getCaseIcon(caseIndex, cases.length)

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Step Indicator Pills (Hinge / Story-like breadcrumb) */}
      <div className="flex items-center justify-between gap-1.5 rounded-2xl bg-white/[0.03] p-1.5 border border-white/5 backdrop-blur-sm">
        {cases.map((c, idx) => {
          const isCurrent = idx === caseIndex
          const isAnswered = mapping[c.id] !== undefined

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSetCaseIndex(idx)}
              aria-label={`Step ${idx + 1}: ${c.label}`}
              aria-current={isCurrent ? 'step' : undefined}
              className={`group flex flex-1 items-center justify-center gap-2 rounded-xl py-2 px-2 text-xs font-medium transition-all duration-200 ${ring} ${
                isCurrent
                  ? 'bg-accent/20 text-white shadow-sm ring-1 ring-accent/40 font-semibold'
                  : isAnswered
                    ? 'text-white/80 hover:bg-white/5 hover:text-white'
                    : 'text-white/40 hover:bg-white/5 hover:text-white/70'
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] tabular-nums transition-colors ${
                  isCurrent
                    ? 'bg-accent text-ink font-bold'
                    : isAnswered
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/10 text-white/50 group-hover:bg-white/15'
                }`}
              >
                {isAnswered && !isCurrent ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : idx + 1}
              </span>
              <span className="hidden truncate sm:inline max-w-[110px]">{c.label}</span>
            </button>
          )
        })}
      </div>

      {/* 2. Active Scenario Target Card */}
      <motion.div
        key={currentCase.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 shadow-xl shadow-black/20"
      >
        {/* Target Chip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/15 text-accent-soft ring-1 ring-accent/30 shadow-inner">
              <CaseIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-soft">
                Context {caseIndex + 1} of {cases.length}
              </span>
              <span className="text-base font-semibold text-white">
                When it’s <span className="text-accent underline decoration-accent/40 underline-offset-4">{currentCase.label}</span>:
              </span>
            </div>
          </div>
          <span className="text-xs text-white/40 tabular-nums font-mono">
            {Object.keys(mapping).length}/{cases.length} answered
          </span>
        </div>

        {/* Quick-Reply Action Bubbles */}
        <div role="radiogroup" aria-label={`Response for ${currentCase.label}`} className="flex flex-col gap-2.5 pt-1">
          {options.map((o, optIdx) => {
            const checked = selectedOptionId === o.id
            return (
              <motion.button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={checked}
                whileTap={{ scale: 0.98 }}
                onClick={() => onMap(currentCase.id, o.id)}
                className={`group relative flex w-full items-start gap-3.5 rounded-2xl p-4 text-left transition-all duration-200 ${ring} ${
                  checked
                    ? 'bg-gradient-to-r from-accent/20 to-fuchsia-500/10 text-white ring-2 ring-accent shadow-md shadow-accent/10'
                    : 'bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white border border-white/5 hover:border-white/15'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition-colors ${
                    checked
                      ? 'bg-accent text-ink font-bold shadow-sm'
                      : 'bg-white/10 text-white/50 group-hover:bg-white/15 group-hover:text-white/80'
                  }`}
                >
                  {checked ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : optIdx + 1}
                </div>
                <span className="flex-1 text-sm leading-snug">{o.label}</span>
              </motion.button>
            )
          })}
        </div>

        {/* Stepper Navigation Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={() => onSetCaseIndex(caseIndex - 1)}
            disabled={caseIndex === 0}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-white/50 transition-colors enabled:hover:text-white disabled:opacity-0 ${ring}`}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous context</span>
          </button>

          {caseIndex < cases.length - 1 ? (
            <button
              type="button"
              onClick={() => onSetCaseIndex(caseIndex + 1)}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-accent-soft transition-colors hover:text-white ${ring}`}
            >
              <span>Next context</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="text-xs text-white/40">All set ✨</span>
          )}
        </div>
      </motion.div>

      {/* Helper: Same for everyone */}
      {onFillAll && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-white/30" />
            Same reaction for all?
          </span>
          {options.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => onFillAll(o.id)}
              className={`rounded-lg bg-white/5 px-2.5 py-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white border border-white/5 ${ring}`}
            >
              {o.label.length > 25 ? `${o.label.slice(0, 25)}…` : o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
