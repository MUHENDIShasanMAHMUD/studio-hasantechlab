<script setup>
import { computed } from 'vue'
import { pwmPoints } from '../calculations.js'
import MetricCard from './MetricCard.vue'
const props = defineProps({ modelValue: Object, readOnly: Boolean })
const emit = defineEmits(['update:modelValue'])
const waveform = computed(() => pwmPoints(props.modelValue))
function set(key, event) { emit('update:modelValue', { ...props.modelValue, [key]: Number(event.target.value) }) }
</script>
<template>
  <section class="tool-panel"><div class="tool-heading"><div><span class="eyebrow">02 / SIGNAL DESIGN</span><h2>PWM waveform<br><em>visualizer</em></h2></div><div class="tool-badge">LIVE SVG</div></div>
    <div class="wave-wrap"><svg viewBox="0 0 720 220" role="img" aria-label="PWM waveform"><path d="M0 44H720M0 176H720" class="grid-line" /><polyline :points="waveform.points" class="wave-line" /></svg><div class="wave-axis"><span>0 ms</span><span>{{ (3 / modelValue.frequency * 1000).toFixed(2) }} ms / 3 cycles</span></div></div>
    <div class="control-grid compact"><label>Voltage<input type="range" min="1" max="5" step="0.1" :value="modelValue.voltage" :disabled="readOnly" @input="set('voltage', $event)"><b>{{ modelValue.voltage.toFixed(1) }} V</b></label><label>Frequency<input type="range" min="10" max="10000" step="10" :value="modelValue.frequency" :disabled="readOnly" @input="set('frequency', $event)"><b>{{ modelValue.frequency }} Hz</b></label><label>Duty cycle<input type="range" min="1" max="99" :value="modelValue.duty" :disabled="readOnly" @input="set('duty', $event)"><b>{{ modelValue.duty }}%</b></label></div>
    <div class="metrics"><MetricCard label="High level" :value="waveform.high.toFixed(1)" unit="V" /><MetricCard label="Average voltage" :value="waveform.average.toFixed(2)" unit="V" accent /><MetricCard label="Period" :value="(1000 / modelValue.frequency).toFixed(2)" unit="ms" /></div>
  </section>
</template>
