export function Coachmark({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-sky-400/30 bg-sky-400/10 p-3 text-xs text-sky-100">
      <p className="flex-1 leading-relaxed">New here? Order these by how much each is you, pick what you’d actually do in each, then hit Continue.</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-md bg-white/10 px-2 py-1 text-white/80 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      >
        Got it
      </button>
    </div>
  )
}
