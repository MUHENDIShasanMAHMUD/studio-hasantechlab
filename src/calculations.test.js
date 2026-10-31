import { describe, expect, it } from 'vitest'
import { dividerMetrics, pwmPoints, resistorBands, stepperMetrics } from './calculations.js'

describe('engineering calculations', () => {
  it('calculates stepper pulse rate and linear speed', () => {
    const result = stepperMetrics({ stepsPerRevolution: 200, microsteps: 16, rpm: 120, pitch: 8 })
    expect(result.stepsPerSecond).toBe(6400)
    expect(result.linearSpeed).toBe(16)
  })
  it('generates a PWM waveform and average voltage', () => {
    const result = pwmPoints({ voltage: 3.3, frequency: 1000, duty: 25 })
    expect(result.points).toContain('0,44')
    expect(result.average).toBeCloseTo(0.825)
  })
  it('calculates divider output and resistor bands', () => {
    expect(dividerMetrics({ inputVoltage: 12, topResistance: 10000, bottomResistance: 4700, loadCurrent: 0.02 }).outputVoltage).toBeCloseTo(3.84, 1)
    expect(resistorBands(4700)).toEqual(['yellow', 'violet', 'black', 'gold'])
  })
})
