/**
 * Class recipes for the design system: cream paper, near-black ink, one coral accent, 2px ink
 * borders and hard offset shadows. Keep every surface built from these so screens stay one product.
 */

export const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper'

// Pressable: lifts toward the viewer on hover, presses flat into its shadow on click.
const press =
  'transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:pointer-events-none disabled:opacity-40'

export const btnPrimary = `inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink bg-coral px-6 py-3 text-sm font-bold text-ink shadow-hard hover:shadow-hard-lg ${press} ${ring}`
export const btnSecondary = `inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink bg-white px-5 py-2.5 text-sm font-bold text-ink shadow-hard-sm hover:shadow-hard ${press} ${ring}`
export const btnSmall = `inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-white px-4 py-1.5 text-xs font-bold text-ink shadow-hard-sm hover:shadow-hard ${press} ${ring}`
export const btnGhost = `inline-flex items-center gap-1 rounded text-sm font-semibold text-ink-soft underline decoration-ink/25 decoration-2 underline-offset-4 transition-colors hover:text-ink hover:decoration-coral ${ring}`

/** A raised card (hard shadow) — for the one thing on screen that matters most. */
export const card = 'rounded-card border-2 border-ink bg-white shadow-hard'
/** A flat bordered surface — for everything else. */
export const panel = 'rounded-card border-2 border-ink bg-white'
export const eyebrow = 'text-[11px] font-bold uppercase tracking-[0.16em] text-ink-soft'
export const tag = 'inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold text-ink'
/** The black code stamp, e.g. VAULT · CLUTCH. */
export const stamp = 'inline-block rounded-md border-2 border-ink bg-ink px-2 py-0.5 text-[11px] font-bold tracking-[0.14em] text-paper'

/** A tappable answer: a white card that lifts on hover and turns coral when chosen. */
export function optionClass(selected: boolean): string {
  return `group flex w-full items-start gap-3 rounded-2xl border-2 border-ink px-4 py-3.5 text-left text-[15px] font-medium leading-snug text-ink transition-[transform,box-shadow,background-color] duration-100 ${
    selected
      ? 'bg-coral shadow-hard-sm'
      : 'bg-white hover:-translate-y-px hover:bg-coral-soft hover:shadow-hard-sm active:translate-y-0 active:shadow-none'
  } ${ring}`
}

/** An accent hex at low alpha, for soft fills behind ink text. */
export const tint = (hex: string, alpha = '40') => `${hex}${alpha}`
