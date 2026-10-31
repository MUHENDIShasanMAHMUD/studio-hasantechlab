import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StepperTool from './StepperTool.vue'

describe('StepperTool', () => {
  it('renders metrics and emits reactive slider changes', async () => {
    const wrapper = mount(StepperTool, { props: { modelValue: { stepsPerRevolution: 200, microsteps: 16, rpm: 120, pitch: 8 }, readOnly: false } })
    expect(wrapper.text()).toContain('6400')
    const slider = wrapper.find('input[type="range"]')
    await slider.setValue(300)
    expect(wrapper.emitted('update:modelValue')[0][0]).toMatchObject({ stepsPerRevolution: 300 })
  })
  it('disables controls in read-only mode', () => {
    const wrapper = mount(StepperTool, { props: { modelValue: { stepsPerRevolution: 200, microsteps: 16, rpm: 120, pitch: 8 }, readOnly: true } })
    expect(wrapper.findAll('input:disabled')).toHaveLength(4)
  })
})
