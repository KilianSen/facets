export function Coachmark({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div role="note" aria-live="polite" className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 p-3 text-xs text-sky-100">
      <p className="flex-1 leading-relaxed">New here? Order these by how much each is you, pick what you’d actually do in each, then hit Continue.</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-md bg-white/10 px-2 py-1 text-white/80 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        Got it
      </button>
    </div>
  )
}
