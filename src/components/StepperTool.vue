<script setup>
import { computed } from 'vue'
import { stepperMetrics } from '../calculations.js'
import MetricCard from './MetricCard.vue'
const props = defineProps({ modelValue: Object, readOnly: Boolean })
const emit = defineEmits(['update:modelValue'])
const metrics = computed(() => stepperMetrics(props.modelValue))
const code = computed(() => `// TechLab stepper pulse profile\nconst int STEP_PIN = 18;\nconst int DIR_PIN = 19;\nconst float PULSE_US = ${metrics.value.pulsePeriodUs.toFixed(1)};\n\nvoid loop() {\n  digitalWrite(STEP_PIN, HIGH);\n  delayMicroseconds(PULSE_US / 2);\n  digitalWrite(STEP_PIN, LOW);\n  delayMicroseconds(PULSE_US / 2);\n}`)
function set(key, event) { emit('update:modelValue', { ...props.modelValue, [key]: Number(event.target.value) }) }
</script>
<template>
  <section class="tool-panel"><div class="tool-heading"><div><span class="eyebrow">01 / MOTION CONTROL</span><h2>Stepper motor<br><em>speed lab</em></h2></div><div class="tool-badge">ESP32 READY</div></div>
    <div class="control-grid"><label>Motor steps / rev<input type="range" min="48" max="400" :value="modelValue.stepsPerRevolution" :disabled="readOnly" @input="set('stepsPerRevolution', $event)"><b>{{ modelValue.stepsPerRevolution }}</b></label><label>Microsteps<input type="range" min="1" max="64" :value="modelValue.microsteps" :disabled="readOnly" @input="set('microsteps', $event)"><b>1 / {{ modelValue.microsteps }}</b></label><label>Target RPM<input type="range" min="10" max="600" :value="modelValue.rpm" :disabled="readOnly" @input="set('rpm', $event)"><b>{{ modelValue.rpm }} rpm</b></label><label>Lead screw pitch<input type="number" min="1" :value="modelValue.pitch" :disabled="readOnly" @input="set('pitch', $event)"><b>mm / rev</b></label></div>
    <div class="metrics"><MetricCard label="Pulse rate" :value="metrics.stepsPerSecond.toFixed(0)" unit="steps/s" accent /><MetricCard label="Pulse period" :value="metrics.pulsePeriodUs.toFixed(1)" unit="µs" /><MetricCard label="Linear speed" :value="metrics.linearSpeed.toFixed(2)" unit="mm/s" /></div>
    <div class="code-block"><div class="code-label">GENERATED C++ / ARDUINO</div><pre>{{ code }}</pre></div>
  </section>
</template>
