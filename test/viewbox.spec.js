import {viewBox} from '../src/viewbox'
import {expect} from 'chai'

/* global describe, it */

describe('viewbox()', () => {
  it('should calculate the correct viewbox', () => {
    expect(viewBox(600, 300, 1200, 600)).to.deep.equal({
      width: 1200,
      height: 600,
      top: 0,
      left: 0
    })
    expect(viewBox(600, 300, 900, 600), 'If height will be smaller then viewbox, move photo left, should have full height').to.deep.equal({
      width: 1200,
      height: 600,
      top: 0,
      left: -300
    })
    expect(viewBox(300, 600, 900, 600), 'If width will be smaller then viewbox, move photo down, should have full width').to.deep.equal({
      width: 900,
      height: 1800,
      top: -1200,
      left: 0
    })
  })
})
