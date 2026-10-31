<script setup>
import { onMounted, ref } from 'vue'
import { ExternalLink, FolderOpen, LoaderCircle, X } from 'lucide-vue-next'
import { useSessionStore } from './stores/session.js'
import { useWorkspaceStore } from './stores/workspace.js'
import { getMine, getSnapshot } from './api.js'
import Toolbar from './components/Toolbar.vue'
import StepperTool from './components/StepperTool.vue'
import PwmTool from './components/PwmTool.vue'
import DividerTool from './components/DividerTool.vue'

const session = useSessionStore()
const workspace = useWorkspaceStore()
const isDark = ref(localStorage.getItem('techlab_theme') !== 'light')
const projectsOpen = ref(false)
const projectsLoading = ref(false)
const projectsError = ref('')
const projects = ref([])
function applyTheme() {
  document.documentElement.classList.toggle('dark', isDark.value)
  document.documentElement.style.colorScheme = isDark.value ? 'dark' : 'light'
  localStorage.setItem('techlab_theme', isDark.value ? 'dark' : 'light')
}
onMounted(async () => {
  await session.init()
  applyTheme()
  const match = location.pathname.match(/^\/s\/([a-z0-9]+)$/i)
  if (!match) return
  try {
    const { snapshot } = await getSnapshot(match[1])
    workspace.activeSnapshotId = snapshot.id
    workspace.activeTool = snapshot.tool_type
    workspace.readOnly = !snapshot.isOwner
    Object.assign(workspace.stepper, snapshot.config.stepper || {})
    Object.assign(workspace.pwm, snapshot.config.pwm || {})
    Object.assign(workspace.divider, snapshot.config.divider || {})
  } catch (error) { workspace.notice = error.message }
})
function selectTool(tool) { workspace.activeTool = tool }
function toggleTheme() { isDark.value = !isDark.value; applyTheme() }
async function openProjects() {
  projectsOpen.value = true
  projectsLoading.value = true
  projectsError.value = ''
  try { projects.value = (await getMine()).snapshots || [] }
  catch (error) { projectsError.value = error.message; projects.value = [] }
  finally { projectsLoading.value = false }
}
function closeProjects() { projectsOpen.value = false }
function formatProjectDate(value) {
  return new Intl.DateTimeFormat('ar', { dateStyle: 'medium' }).format(new Date(value))
}
function projectToolLabel(type) {
  return ({ stepper_calc: 'Stepper Speed', pwm_calc: 'PWM Waveform', divider_calc: 'Resistor Divider' })[type] || type
}
</script>
<template>
  <div class="app-shell"><Toolbar :saving="workspace.saving" :read-only="workspace.readOnly" :dark="isDark" @save="workspace.persist" @toggle-theme="toggleTheme" />
    <main><div class="hero"><div><span class="eyebrow">HASAN TECH LAB / 2026</span><h1>Build it.<br><span>Measure it.</span></h1></div><p class="hero-note">A quiet place for loud ideas.<br>Interactive hardware experiments,<br>ready to share.</p></div>
      <nav class="tool-tabs"><button :class="{ active: workspace.activeTool === 'stepper_calc' }" @click="selectTool('stepper_calc')"><span>01</span> STEPPER SPEED</button><button :class="{ active: workspace.activeTool === 'pwm_calc' }" @click="selectTool('pwm_calc')"><span>02</span> PWM WAVEFORM</button><button :class="{ active: workspace.activeTool === 'divider_calc' }" @click="selectTool('divider_calc')"><span>03</span> RESISTOR DIVIDER</button></nav>
      <div v-if="workspace.readOnly" class="fork-bar"><span>Viewing a shared snapshot in read-only mode.</span><button class="save-button" @click="workspace.fork">FORK / CLONE PROJECT</button></div><StepperTool v-if="workspace.activeTool === 'stepper_calc'" v-model="workspace.stepper" :read-only="workspace.readOnly" /><PwmTool v-else-if="workspace.activeTool === 'pwm_calc'" v-model="workspace.pwm" :read-only="workspace.readOnly" /><DividerTool v-else v-model="workspace.divider" :read-only="workspace.readOnly" />
      <div v-if="workspace.notice" class="toast">{{ workspace.notice }} <a v-if="workspace.snapshotUrl" :href="workspace.snapshotUrl">OPEN LINK</a></div>
    </main><footer><span>© HASAN TECH LAB</span><span>DEVICE {{ session.deviceToken.slice(0, 8).toUpperCase() }} · NO ACCOUNT REQUIRED</span><button class="projects-button" type="button" @click="openProjects"><FolderOpen :size="14" />📂 مشاريعي</button><span>WAL / SQLITE READY</span></footer>
    <div v-if="projectsOpen" class="modal-backdrop" role="presentation" @click.self="closeProjects"><section class="projects-modal" role="dialog" aria-modal="true" aria-labelledby="projects-title"><div class="projects-modal__header"><div><span class="eyebrow">LOCAL WORKSPACE</span><h2 id="projects-title">مشاريعي</h2></div><button class="icon-button" type="button" title="Close projects" aria-label="Close projects" @click="closeProjects"><X :size="17" /></button></div><div v-if="projectsLoading" class="projects-state"><LoaderCircle class="spin" :size="22" /><span>Loading projects...</span></div><div v-else-if="projectsError" class="projects-state projects-state--error">{{ projectsError }}</div><div v-else-if="projects.length === 0" class="projects-state"><FolderOpen :size="22" /><span>لا توجد مشاريع محفوظة بعد.</span></div><ul v-else class="projects-list"><li v-for="project in projects" :key="project.id" class="project-row"><div><strong>{{ project.title }}</strong><span>{{ projectToolLabel(project.tool_type) }} · {{ formatProjectDate(project.created_at) }}</span></div><a :href="`/s/${project.id}`" class="project-open">Open <ExternalLink :size="14" /></a></li></ul></section></div>
  </div>
</template>
