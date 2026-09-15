import { describe, it, expect } from 'vitest'
import { firstPerson, dataUrlToBlob } from './story'
import { describeContingency, describeCurvature } from '../engine'
import { CONTENT } from '../content'

describe('firstPerson', () => {
  it('turns result tells into things you would post about yourself', () => {
    expect(firstPerson("When it's someone close, you take charge; when it's a stranger, you follow."))
      .toBe("When it's someone close, I take charge; when it's a stranger, I follow.")
    expect(firstPerson(describeContingency('audience', 'directness', -3, CONTENT)))
      .toBe("When I'm being watched, I stay diplomatic; when it's just me, I get blunt.")
  })

  it('handles "to you", "you\'ve" and "your"', () => {
    expect(firstPerson(describeContingency('initiative', 'composure', 3, CONTENT)))
      .toBe('When I make the first move, I stay calm; when they came to me, I get rattled.')
    expect(firstPerson(describeContingency('power', 'lead', 3, CONTENT)))
      .toBe("When I hold the power, I take charge; when I've got no leverage, I follow.")
    expect(firstPerson('Your shape, your call.')).toBe('My shape, my call.')
    expect(firstPerson('comes alive with eyes on you')).toBe('comes alive with eyes on me')
    expect(firstPerson('all-in and all-heat with your people')).toBe('all-in and all-heat with my people')
  })

  it('works on both-ways tells too', () => {
    expect(firstPerson(describeCurvature('stakes', 'composure', -3, CONTENT))).toMatch(/^When stakes sits in the middle, I stay calm/)
  })
})

describe('dataUrlToBlob', () => {
  it('decodes a base64 data URL with its mime type', () => {
    const blob = dataUrlToBlob('data:image/png;base64,iVBORw0KGgo=')
    expect(blob.type).toBe('image/png')
    expect(blob.size).toBe(8)
  })
})
