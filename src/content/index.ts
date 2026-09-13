import type { Content } from '../engine/types'
import { AXES } from './axes'
import { DIMS } from './dimensions'
import { ARCHETYPES } from './archetypes'
import { QUESTIONS } from './questions'
import { SHARPEN_QUESTIONS } from './sharpenQuestions'
import { MOTIVES } from './motives'

export const CONTENT: Content = {
  axes: AXES,
  dims: DIMS,
  archetypes: ARCHETYPES,
  // Base bank + the parallel "reserve" (drawn only for the adaptive sharpen round; excluded from
  // base selection by `selectQuestions`). Reserve lives here so permalinks/resume rebuild by id.
  questions: [...QUESTIONS, ...SHARPEN_QUESTIONS],
  motives: MOTIVES,
}
