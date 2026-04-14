<script lang="ts">
import { defineComponent, onMounted, onUnmounted } from "vue"

export default defineComponent({
  name: "SolutionsPageMount",
  setup() {
    let cleanup: (() => void) | undefined

    onMounted(() => {
      const root = document.querySelector(".solutions-live")
      if (!root) return

      const cleanupFns: Array<() => void> = []
      const animationTimers: number[] = []

      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add("shown")
          observer.unobserve(entry.target)
        })
      }, {
        rootMargin: "75px 0px -75px 0px",
      })

      root.querySelectorAll<HTMLElement>(".imageTextCols .image img, .contentBlock.multiCol .content img").forEach((image) => {
        imageObserver.observe(image)
      })

      const bigNumbersObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          const container = entry.target as HTMLElement
          container.classList.add("shown")

          let delay = 250
          const delayStep = 400

          container.querySelectorAll<HTMLElement>(".bigNumberOuter .bigNumber").forEach((numberElem) => {
            const timer = window.setTimeout(() => {
              numberElem.classList.add("shown")
            }, delay)
            animationTimers.push(timer)
            delay += delayStep
          })

          observer.unobserve(container)
        })
      }, {
        rootMargin: "75px 0px -75px 0px",
      })

      root.querySelectorAll<HTMLElement>(".bigNumbersContainer").forEach((container) => {
        bigNumbersObserver.observe(container)
      })

      cleanupFns.push(() => imageObserver.disconnect())
      cleanupFns.push(() => bigNumbersObserver.disconnect())

      const carousel = root.querySelector<HTMLElement>("[data-solutions-rotary]")
      const rotator = root.querySelector<HTMLElement>("[data-rotator]")
      const textContainer = root.querySelector<HTMLElement>("[data-rotary-text]")
      if (!carousel || !rotator || !textContainer) {
        cleanup = () => {
          animationTimers.forEach((timer) => window.clearTimeout(timer))
          cleanupFns.forEach((fn) => fn())
        }
        return
      }

      const logos = Array.from(rotator.querySelectorAll<HTMLElement>(".rotatorLogo"))
      const texts = Array.from(textContainer.querySelectorAll<HTMLElement>(".rotatorText"))
      const toggles = Array.from(textContainer.querySelectorAll<HTMLElement>("[data-rotary-toggle]"))
      const statuses = Array.from(textContainer.querySelectorAll<HTMLElement>("[data-rotary-status]"))
      const icons = Array.from(textContainer.querySelectorAll<HTMLElement>("[data-rotary-icon]"))
      const stepClasses = ["step1", "step2", "step3", "step4", "step5", "step6", "step7"]

      const state = {
        currentLogoIndex: 1,
        logoCount: logos.length,
        timeoutWait: 4000,
        paused: false,
        rotating: false,
        logoRotateTimer: 0 as number | undefined,
        textFadeInTimer: 0 as number | undefined,
        resetTimer: 0 as number | undefined,
      }

      const isMobile = () => window.matchMedia("(max-width: 991px)").matches

      const setStep = (step: number) => {
        rotator.classList.remove(...stepClasses)
        rotator.classList.add(`step${step}`)
      }

      const clearTimers = () => {
        if (state.logoRotateTimer) window.clearTimeout(state.logoRotateTimer)
        if (state.textFadeInTimer) window.clearTimeout(state.textFadeInTimer)
        if (state.resetTimer) window.clearTimeout(state.resetTimer)
      }

      const updateControls = () => {
        const iconText = state.paused ? ">" : "||"
        const statusText = state.paused ? "Paused" : "Playing"
        icons.forEach((icon) => {
          icon.textContent = iconText
        })
        statuses.forEach((status) => {
          status.textContent = statusText
        })
        carousel.classList.toggle("paused", state.paused)
      }

      const activateText = (index: number) => {
        texts.forEach((text) => {
          text.classList.toggle("is-active", Number(text.dataset.index) === index)
        })
      }

      const measureHeight = () => {
        if (isMobile()) {
          textContainer.style.height = "auto"
          return
        }

        let maxHeight = 0
        texts.forEach((text) => {
          const wasActive = text.classList.contains("is-active")
          text.classList.add("is-measuring", "is-active")
          maxHeight = Math.max(maxHeight, text.firstElementChild?.clientHeight ?? 0)
          text.classList.remove("is-measuring")
          if (!wasActive) {
            text.classList.remove("is-active")
          }
        })

        activateText(state.currentLogoIndex)
        textContainer.style.height = maxHeight ? `${maxHeight}px` : ""
      }

      const queueNextRotation = () => {
        if (state.logoRotateTimer) window.clearTimeout(state.logoRotateTimer)
        if (state.paused || isMobile()) return
        state.logoRotateTimer = window.setTimeout(rotateToNextLogo, state.timeoutWait)
      }

      const rotateToLogo = (requestedIndex: number) => {
        if (state.rotating) return
        if (requestedIndex === state.currentLogoIndex) return

        state.rotating = true
        clearTimers()

        const nextIndex = requestedIndex > state.logoCount ? 1 : requestedIndex
        setStep(requestedIndex > state.logoCount ? 7 : requestedIndex)

        texts.forEach((text) => {
          text.classList.remove("is-active")
        })

        state.currentLogoIndex = nextIndex

        state.textFadeInTimer = window.setTimeout(() => {
          activateText(state.currentLogoIndex)
          state.rotating = false
          queueNextRotation()
        }, 600)

        if (requestedIndex > state.logoCount) {
          state.resetTimer = window.setTimeout(() => {
            setStep(1)
          }, 1500)
        }
      }

      const rotateToNextLogo = () => {
        rotateToLogo(state.currentLogoIndex + 1)
      }

      const pause = () => {
        state.paused = true
        if (state.logoRotateTimer) window.clearTimeout(state.logoRotateTimer)
        updateControls()
      }

      const play = () => {
        state.paused = false
        updateControls()
        if (isMobile()) return
        rotateToNextLogo()
      }

      const logoListeners = logos.map((logo) => {
        const onClick = () => {
          if (state.rotating || isMobile()) return
          pause()
          let requestedIndex = Number(logo.dataset.index) || 1
          if (requestedIndex === 1) {
            requestedIndex = 7
          }
          rotateToLogo(requestedIndex)
        }
        logo.addEventListener("click", onClick)
        return { element: logo, handler: onClick }
      })

      const toggleListeners = toggles.map((toggle) => {
        const onClick = (event: Event) => {
          event.preventDefault()
          state.paused ? play() : pause()
        }
        toggle.addEventListener("click", onClick)
        return { element: toggle, handler: onClick }
      })

      const onResize = () => {
        measureHeight()
        if (isMobile()) {
          if (state.logoRotateTimer) window.clearTimeout(state.logoRotateTimer)
        } else if (!state.paused) {
          queueNextRotation()
        }
      }

      window.addEventListener("resize", onResize)

      activateText(1)
      measureHeight()
      updateControls()
      queueNextRotation()

      cleanup = () => {
        clearTimers()
        animationTimers.forEach((timer) => window.clearTimeout(timer))
        cleanupFns.forEach((fn) => fn())
        window.removeEventListener("resize", onResize)
        logoListeners.forEach(({ element, handler }) => {
          element.removeEventListener("click", handler)
        })
        toggleListeners.forEach(({ element, handler }) => {
          element.removeEventListener("click", handler)
        })
      }
    })

    onUnmounted(() => {
      cleanup?.()
    })

    return () => null
  },
})
</script>
