import type { BehaviorDim } from '../engine/types'

// highLabel / lowLabel are verb phrases that read after "you …".
export const DIMS: BehaviorDim[] = [
  { id: 'warmth',     name: 'Warmth',     lowLabel: 'stay cool',       highLabel: 'get warm' },
  { id: 'approach',   name: 'Approach',   lowLabel: 'pull back',       highLabel: 'lean in' },
  { id: 'directness', name: 'Directness', lowLabel: 'stay diplomatic', highLabel: 'get blunt' },
  { id: 'boldness',   name: 'Boldness',   lowLabel: 'play it safe',    highLabel: 'take the risk' },
  { id: 'lead',       name: 'Lead',       lowLabel: 'follow',          highLabel: 'take charge' },
  { id: 'composure',  name: 'Composure',  lowLabel: 'get rattled',     highLabel: 'stay calm' },
]
