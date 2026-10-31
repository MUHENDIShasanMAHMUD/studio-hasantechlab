<script setup>
import { Share2, Sun, Moon, Cpu } from 'lucide-vue-next'
defineProps({ saving: Boolean, readOnly: Boolean, dark: Boolean })
defineEmits(['save', 'toggle-theme'])
</script>
<template>
  <header class="topbar"><div class="brand"><div class="brand-mark"><Cpu :size="18" /></div><div><strong>TECHLAB</strong><span>ENGINEERING SANDBOX</span></div></div><div class="topbar-actions"><span class="status-dot">● LOCAL DEVICE</span><button class="icon-button" :title="dark ? 'Switch to light theme' : 'Switch to dark theme'" :aria-label="dark ? 'Switch to light theme' : 'Switch to dark theme'" :aria-pressed="dark" @click="$emit('toggle-theme')"><Sun v-if="dark" :size="17" /><Moon v-else :size="17" /></button><button class="save-button" :disabled="saving || readOnly" @click="$emit('save')"><Share2 :size="16" />{{ saving ? 'SAVING...' : readOnly ? 'READ ONLY' : 'SAVE & SHARE' }}</button></div></header>
</template>
