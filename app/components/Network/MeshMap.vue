<!-- app/components/Network/MeshMap.vue -->

<!-- Devices in three rings around "You", one ring per hop count. Colours are SVG attributes, not classes. -->
<template>
  <svg viewBox="0 0 400 300" class="h-[300px] w-full" role="img" aria-label="Nearby Afronet devices">
    <circle
      v-for="r in [62, 108, 140]"
      :key="r"
      cx="200"
      cy="150"
      :r="r"
      fill="none"
      stroke="#e4e4de"
      stroke-dasharray="3 5"
    />
    <line
      v-for="n in nodes"
      :key="`l-${n.d.id}`"
      x1="200"
      y1="150"
      :x2="n.x"
      :y2="n.y"
      :stroke="n.d.strength > 0 ? '#0b5d3e' : '#e4e4de'"
      :stroke-opacity="n.d.strength > 0 ? 0.3 : 1"
      :stroke-width="n.d.hops === 1 ? 1.6 : 1"
    />
    <g v-for="n in nodes" :key="n.d.id">
      <circle :cx="n.x" :cy="n.y" :r="isHub(n.d) ? 11 : 8" :fill="swatch(n.d).fill" :stroke="swatch(n.d).stroke" />
      <text :x="n.x" :y="n.y + (n.y > 150 ? 26 : -18)" text-anchor="middle" font-size="9" fill="#606863">
        {{ n.d.owner }}
      </text>
    </g>
    <circle cx="200" cy="150" r="18" fill="#0b5d3e" />
    <text x="200" y="154" text-anchor="middle" font-size="9" font-weight="500" fill="#ffffff">You</text>
  </svg>
</template>

<script setup>
import { meshDevices } from '~/data/network'

const place = (items, radius, cy = 150) =>
  items.map((d, i) => {
    const angle = (Math.PI * 2 * (i + 0.5)) / items.length - Math.PI / 2
    return { d, x: 200 + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius }
  })

const nodes = [
  ...place(
    meshDevices.filter((d) => d.hops === 1),
    62,
  ),
  ...place(
    meshDevices.filter((d) => d.hops === 2),
    108,
  ),
  ...place(
    meshDevices.filter((d) => d.hops >= 3),
    140,
  ),
]

const isHub = (d) => d.kind === 'node' || d.kind === 'gateway'

const swatch = (d) =>
  d.strength === 0
    ? { fill: '#f7f7f4', stroke: '#e4e4de' }
    : isHub(d)
      ? { fill: '#faf3e3', stroke: '#b07f15' }
      : { fill: '#eaf3ee', stroke: '#0b5d3e' }
</script>
