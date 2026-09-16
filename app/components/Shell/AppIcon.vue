<!-- app/components/Shell/AppIcon.vue -->

<!--
  Resolves an app's `icon` key (data/apps.js) to a Font Awesome glyph. Size is
  a prop rather than a class so it never competes with a caller's classes; a
  colour class passed by the caller still applies.
-->
<template>
  <i
    class="fa-solid"
    :class="[icons[name] ?? 'fa-wand-magic-sparkles', size === 'sm' ? 'text-[12px]' : 'text-[18px]']"
    aria-hidden="true"
  ></i>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  // md | sm
  size: { type: String, default: 'md' },
})

const icons = {
  Sparkles: 'fa-wand-magic-sparkles',
  Cpu: 'fa-microchip',
  Blocks: 'fa-cubes',
  FlaskConical: 'fa-flask',
  MessageSquare: 'fa-message',
  Users: 'fa-users',
  Phone: 'fa-phone',
  Mail: 'fa-envelope',
  Radio: 'fa-tower-broadcast',
  FolderOpen: 'fa-folder-open',
  Globe2: 'fa-earth-africa',
  Briefcase: 'fa-briefcase',
  Play: 'fa-play',
  Wallet: 'fa-wallet',
  Store: 'fa-store',
  GraduationCap: 'fa-graduation-cap',
  Newspaper: 'fa-newspaper',
  Settings: 'fa-gear',
}
</script>
