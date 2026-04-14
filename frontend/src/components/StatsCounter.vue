<template>
  <div ref="el" class="text-5xl font-semibold">
    {{ displayValue }}
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"

const props = defineProps<{
  start: number
  end: number
  duration: number
}>()

const displayValue = ref(props.start)
const el = ref<HTMLElement | null>(null)

let hasAnimated = false

function animate() {
  const startTime = performance.now()

  function update(now: number) {
    const progress = Math.min((now - startTime) / props.duration, 1)

    displayValue.value = Math.floor(
      props.start + (props.end - props.start) * progress
    )

    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }

  requestAnimationFrame(update)
}

onMounted(() => {
  if (!el.value) return

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true
        animate()
      }
    })
  }, { threshold: 0.4 })

  observer.observe(el.value)
})
</script>
