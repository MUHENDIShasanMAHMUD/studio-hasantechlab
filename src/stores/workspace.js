import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { saveSnapshot, updateSnapshot } from '../api.js'

export const useWorkspaceStore = defineStore('workspace', () => {
  const activeTool = ref('stepper_calc')
  const activeSnapshotId = ref(null)
  const readOnly = ref(false)
  const saving = ref(false)
  const notice = ref('')
  const snapshotUrl = ref('')
  const stepper = ref({ stepsPerRevolution: 200, microsteps: 16, rpm: 120, pitch: 8 })
  const pwm = ref({ voltage: 3.3, frequency: 1000, duty: 42 })
  const divider = ref({ inputVoltage: 12, topResistance: 10000, bottomResistance: 4700, loadCurrent: 0.02 })
  const config = computed(() => ({ stepper: stepper.value, pwm: pwm.value, divider: divider.value }))

  async function persist() {
    saving.value = true
    notice.value = ''
    try {
      const payload = { toolType: activeTool.value, title: toolLabel(activeTool.value), config: config.value }
      const result = activeSnapshotId.value ? await updateSnapshot(activeSnapshotId.value, { title: payload.title, config: payload.config }) : await saveSnapshot(payload)
      activeSnapshotId.value = result.id || activeSnapshotId.value
      snapshotUrl.value = `${location.origin}/s/${activeSnapshotId.value}`
      await navigator.clipboard?.writeText(snapshotUrl.value)
      notice.value = 'Snapshot saved and link copied'
    } catch (err) { notice.value = err.message }
    finally { saving.value = false }
  }
  function fork() {
    activeSnapshotId.value = null
    readOnly.value = false
    snapshotUrl.value = ''
    notice.value = 'Fork created locally. Save to publish your copy.'
  }
  function toolLabel(type) { return ({ stepper_calc: 'Stepper motor profile', pwm_calc: 'PWM waveform profile', divider_calc: 'Voltage divider profile' })[type] || 'TechLab snapshot' }
  return { activeTool, activeSnapshotId, readOnly, saving, notice, snapshotUrl, stepper, pwm, divider, config, persist, fork, toolLabel }
})
