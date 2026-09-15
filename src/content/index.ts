import type { Content } from '../engine/types'
import { AXES } from './axes'
import { DIMS } from './dimensions'
import { ARCHETYPES } from './archetypes'
import { QUESTIONS } from './questions'
import { SHARPEN_QUESTIONS } from './sharpenQuestions'
import { LIFE_QUESTIONS } from './lifeQuestions'
import { MOTIVES } from './motives'

export const CONTENT: Content = {
  axes: AXES,
  dims: DIMS,
  archetypes: ARCHETYPES,
  // Base bank + the held-out items: the parallel sharpen reserve and the deep dive's across-your-life set (both
  // excluded from base selection by `selectQuestions`). They live here so permalinks/resume rebuild by id.
  questions: [...QUESTIONS, ...SHARPEN_QUESTIONS, ...LIFE_QUESTIONS],
  motives: MOTIVES,
}
