export function stepperMetrics({ stepsPerRevolution, microsteps, rpm, pitch }) {
  const stepsPerSecond = (stepsPerRevolution * microsteps * rpm) / 60
  return { stepsPerSecond, pulsePeriodUs: stepsPerSecond ? 1000000 / stepsPerSecond : 0, linearSpeed: (rpm * pitch) / 60 }
}

export function pwmPoints({ voltage, frequency, duty }, width = 720, height = 220) {
  const points = []
  const cycles = 3
  for (let x = 0; x <= width; x += 4) {
    const phase = ((x / width) * cycles * 100) % 100
    points.push(`${x},${phase < duty ? height * 0.2 : height * 0.8}`)
  }
  return { points: points.join(' '), high: voltage, average: voltage * duty / 100 }
}

export function dividerMetrics({ inputVoltage, topResistance, bottomResistance, loadCurrent }) {
  const outputVoltage = inputVoltage * bottomResistance / (topResistance + bottomResistance)
  return { outputVoltage, current: inputVoltage / (topResistance + bottomResistance), power: outputVoltage * loadCurrent }
}

export function resistorBands(value) {
  const normalized = Math.max(10, Math.round(value)).toString().slice(0, 3)
  const colors = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white']
  return [colors[Number(normalized[0])], colors[Number(normalized[1])], colors[Number(normalized[2])], 'gold']
}
