<script setup>
import { computed } from 'vue'
import { dividerMetrics, resistorBands } from '../calculations.js'
import MetricCard from './MetricCard.vue'
const props = defineProps({ modelValue: Object, readOnly: Boolean })
const emit = defineEmits(['update:modelValue'])
const metrics = computed(() => dividerMetrics(props.modelValue))
const bands = computed(() => resistorBands(props.modelValue.topResistance))
function set(key, event) { emit('update:modelValue', { ...props.modelValue, [key]: Number(event.target.value) }) }
</script>
<template>
  <section class="tool-panel"><div class="tool-heading"><div><span class="eyebrow">03 / POWER & PROTECTION</span><h2>Voltage divider<br><em>builder</em></h2></div><div class="tool-badge">PASSIVE</div></div>
    <div class="resistor-stage"><div class="resistor"><i v-for="(band, index) in bands" :key="index" :class="`band band-${band}`"></i></div><span>{{ modelValue.topResistance.toLocaleString() }} Ω · 4-band code</span></div>
    <div class="control-grid compact"><label>Input voltage<input type="number" min="0.1" step="0.1" :value="modelValue.inputVoltage" :disabled="readOnly" @input="set('inputVoltage', $event)"><b>V</b></label><label>Top resistor<input type="number" min="10" :value="modelValue.topResistance" :disabled="readOnly" @input="set('topResistance', $event)"><b>Ω</b></label><label>Bottom resistor<input type="number" min="10" :value="modelValue.bottomResistance" :disabled="readOnly" @input="set('bottomResistance', $event)"><b>Ω</b></label></div>
    <div class="metrics"><MetricCard label="Output voltage" :value="metrics.outputVoltage.toFixed(2)" unit="V" accent /><MetricCard label="Circuit current" :value="(metrics.current * 1000).toFixed(2)" unit="mA" /><MetricCard label="Load power" :value="(metrics.power * 1000).toFixed(2)" unit="mW" /></div>
  </section>
</template>
