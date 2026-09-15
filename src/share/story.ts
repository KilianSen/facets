/**
 * Helpers for the story share card: result sentences are written to "you"; a card you post says "I".
 * Rewrites the second person the tells use ("you get warm", "you're being watched", "they came to you").
 */
export function firstPerson(text: string): string {
  return text
    // "you" as an object ("they came to you", "eyes on you") becomes "me"; as a subject, "I".
    .replace(/\b(to|just|on|at|for|with|around|about|of|than) you\b/g, '$1 me')
    .replace(/\b[Yy]ou're\b/g, "I'm")
    .replace(/\b[Yy]ou've\b/g, "I've")
    .replace(/\byour\b/g, 'my')
    .replace(/\bYour\b/g, 'My')
    .replace(/\b[Yy]ou\b/g, 'I')
}

/** A `data:` URL (what html-to-image returns) as a Blob, without a network fetch. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body = ''] = dataUrl.split(',')
  const mime = head.match(/^data:([^;,]+)/)?.[1] ?? 'application/octet-stream'
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export const STORY_FILENAME = 'facets-story.png'
