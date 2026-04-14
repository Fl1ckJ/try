<script lang="ts">
import { defineComponent, onMounted, onUnmounted } from "vue"

type CleanupFn = () => void

export default defineComponent({
  name: "SolutionDetailPageMount",
  setup() {
    let cleanup: CleanupFn | undefined

    onMounted(() => {
      const root = document.querySelector(".solution-detail-live")
      if (!(root instanceof HTMLElement)) return

      const cleanupFns: CleanupFn[] = []

      const revealItems = Array.from(new Set([
        ...Array.from(root.querySelectorAll<HTMLElement>(".solution-reveal")),
        ...Array.from(root.querySelectorAll<HTMLElement>(".featureIcon")),
        ...Array.from(root.querySelectorAll<HTMLElement>(".bigNumber")),
        ...Array.from(root.querySelectorAll<HTMLElement>(".productLogos img")),
        ...Array.from(root.querySelectorAll<HTMLElement>(".contentBlock.big-text .content img")),
      ]))

      if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return
            entry.target.classList.add("is-shown")
            entry.target.classList.add("shown")
            observer.unobserve(entry.target)
          })
        }, {
          rootMargin: "75px 0px -75px 0px",
        })

        revealItems.forEach((item) => revealObserver.observe(item))
        cleanupFns.push(() => revealObserver.disconnect())
      } else {
        revealItems.forEach((item) => {
          item.classList.add("is-shown")
          item.classList.add("shown")
        })
      }

      root.querySelectorAll<HTMLElement>("[data-solution-testimonials]").forEach((slider) => {
        const wrapper = slider.querySelector<HTMLElement>("[data-solution-testimonial-wrapper]")
        const items = Array.from(slider.querySelectorAll<HTMLElement>("[data-solution-testimonial]"))
        const navButtons = Array.from(slider.querySelectorAll<HTMLButtonElement>("[data-solution-testimonial-nav]"))
        const previousButton = slider.querySelector<HTMLButtonElement>("[data-solution-testimonial-prev]")
        const nextButton = slider.querySelector<HTMLButtonElement>("[data-solution-testimonial-next]")

        if (!items.length || !(wrapper instanceof HTMLElement)) return

        let activeIndex = 0
        let rotationTimer: number | undefined

        const updateHeight = () => {
          const activeItem = items[activeIndex]
          if (!activeItem) return
          wrapper.style.height = `${activeItem.offsetHeight}px`
        }

        const activate = (requestedIndex: number) => {
          activeIndex = (requestedIndex + items.length) % items.length
          items.forEach((item, index) => {
            item.classList.toggle("is-active", index === activeIndex)
          })
          navButtons.forEach((button, index) => {
            button.classList.toggle("active", index === activeIndex)
          })
          window.requestAnimationFrame(updateHeight)
        }

        const clearRotationTimer = () => {
          if (rotationTimer) {
            window.clearTimeout(rotationTimer)
            rotationTimer = undefined
          }
        }

        const queueNextRotation = () => {
          if (items.length <= 1) return
          clearRotationTimer()
          rotationTimer = window.setTimeout(() => {
            activate(activeIndex + 1)
            queueNextRotation()
          }, 10000)
        }

        const onPreviousClick = () => {
          activate(activeIndex - 1)
          queueNextRotation()
        }

        const onNextClick = () => {
          activate(activeIndex + 1)
          queueNextRotation()
        }

        const navListeners = navButtons.map((button, index) => {
          const onClick = () => {
            activate(index)
            queueNextRotation()
          }

          button.addEventListener("click", onClick)
          return { element: button, handler: onClick }
        })

        const pauseRotation = () => clearRotationTimer()
        const resumeRotation = () => queueNextRotation()
        const onResize = () => updateHeight()

        previousButton?.addEventListener("click", onPreviousClick)
        nextButton?.addEventListener("click", onNextClick)
        slider.addEventListener("mouseenter", pauseRotation)
        slider.addEventListener("mouseleave", resumeRotation)
        window.addEventListener("resize", onResize)

        activate(0)
        queueNextRotation()

        cleanupFns.push(() => {
          clearRotationTimer()
          previousButton?.removeEventListener("click", onPreviousClick)
          nextButton?.removeEventListener("click", onNextClick)
          slider.removeEventListener("mouseenter", pauseRotation)
          slider.removeEventListener("mouseleave", resumeRotation)
          window.removeEventListener("resize", onResize)
          navListeners.forEach(({ element, handler }) => {
            element.removeEventListener("click", handler)
          })
        })
      })

      cleanup = () => {
        cleanupFns.forEach((fn) => fn())
      }
    })

    onUnmounted(() => {
      cleanup?.()
    })

    return () => null
  },
})
</script>
