import type { KeyboardEvent } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useReducedMotion } from 'framer-motion'
import type { Case, Option } from '../engine/types'
import { reorderByIds } from './reorder'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'
const moveBtn = `flex h-9 w-9 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white ${ring}`

function Row({
  c, index, options, mapping, onMap, onMove,
}: {
  c: Case
  index: number
  options: Option[]
  mapping: Record<string, string>
  onMap: (caseId: string, optionId: string) => void
  onMove: (index: number, dir: -1 | 1) => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: c.id })
  const reduce = useReducedMotion()
  const style = { transform: CSS.Transform.toString(transform), transition: reduce ? undefined : transition, opacity: isDragging ? 0.6 : 1, zIndex: isDragging ? 10 : undefined }

  const selectedIdx = options.findIndex(o => mapping[c.id] === o.id)
  const tabbable = selectedIdx >= 0 ? selectedIdx : 0
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const next = (idx + d + options.length) % options.length
    onMap(c.id, options[next].id)
    ;(e.currentTarget.closest('[role="radiogroup"]')?.querySelectorAll<HTMLElement>('[role="radio"]')[next])?.focus()
  }

  return (
    <li ref={setNodeRef} style={style} className="rounded-beam bg-white/[0.04] p-3 md:flex md:items-start md:gap-4">
      <div className="mb-2 flex items-center gap-2 md:mb-0 md:w-52 md:shrink-0 md:pt-2">
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          type="button"
          aria-label={`drag to reorder ${c.label}`}
          className={`flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-white/40 hover:text-white/70 active:cursor-grabbing ${ring}`}
        >
          <span aria-hidden="true">⠿</span>
        </button>
        <span className="tabular-nums text-xs text-white/40">{index + 1}</span>
        <span className="text-sm text-white/85">{c.label}</span>
        <span className="ml-auto flex gap-1 md:hidden">
          <button type="button" aria-label={`move ${c.label} up`} onClick={() => onMove(index, -1)} className={moveBtn}>↑</button>
          <button type="button" aria-label={`move ${c.label} down`} onClick={() => onMove(index, 1)} className={moveBtn}>↓</button>
        </span>
      </div>
      <div role="radiogroup" aria-label={c.label} className={`grid grid-cols-1 gap-2 md:flex-1 ${options.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {options.map((o, idx) => {
          const checked = mapping[c.id] === o.id
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={idx === tabbable ? 0 : -1}
              onKeyDown={e => onKey(e, idx)}
              onClick={() => onMap(c.id, o.id)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${ring} ${checked ? 'bg-accent/20 text-white ring-1 ring-accent/50' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </li>
  )
}

export function DependsCard({
  cases, options, ranking, mapping, onReorder, onMap, onFillAll,
}: {
  cases: Case[]
  options: Option[]
  ranking: string[]
  mapping: Record<string, string>
  onReorder: (ranking: string[]) => void
  onMap: (caseId: string, optionId: string) => void
  onFillAll: (optionId: string) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const ordered = ranking.map(id => cases.find(c => c.id === id)).filter((c): c is Case => !!c)

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (over && active.id !== over.id) onReorder(reorderByIds(ranking, String(active.id), String(over.id)))
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= ranking.length) return
    const next = [...ranking]
    ;[next[i], next[j]] = [next[j], next[i]]
    onReorder(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/70">Order these from most to least like you (drag, or use ↑/↓), and pick what you’d actually do in each.</p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ranking} strategy={verticalListSortingStrategy}>
          <ol className="flex flex-col gap-3">
            {ordered.map((c, i) => (
              <Row key={c.id} c={c} index={i} options={options} mapping={mapping} onMap={onMap} onMove={move} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
        <span>Same for everyone?</span>
        {options.map(o => (
          <button
            key={o.id}
            type="button"
            aria-label={`same for all: ${o.label}`}
            onClick={() => onFillAll(o.id)}
            className={`rounded-md bg-white/5 px-2 py-1 text-white/70 transition-colors hover:bg-white/10 ${ring}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
