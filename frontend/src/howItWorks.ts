type LottieAnimation = {
  isPaused: boolean
  pause(): void
  play(): void
}

const initHowItWorksRevealAnimations = () => {
  const revealItems = Array.from(document.querySelectorAll<HTMLElement>("[data-how-it-works-reveal]"))
  const numberGroups = Array.from(document.querySelectorAll<HTMLElement>("[data-how-it-works-number-group]"))

  if (revealItems.length === 0 && numberGroups.length === 0) return

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-shown"))
    numberGroups.forEach((group) => {
      group.querySelectorAll<HTMLElement>("[data-how-it-works-number]").forEach((item) => {
        item.classList.add("is-shown")
      })
    })
    return
  }

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      entry.target.classList.add("is-shown")
      observer.unobserve(entry.target)
    })
  }, {
    rootMargin: "75px 0px -75px 0px",
  })

  revealItems.forEach((item) => {
    revealObserver.observe(item)
  })

  const numbersObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return

      const group = entry.target as HTMLElement
      if (group.dataset.numbersShown === "true") {
        observer.unobserve(group)
        return
      }

      group.dataset.numbersShown = "true"
      group.querySelectorAll<HTMLElement>("[data-how-it-works-number]").forEach((item, index) => {
        window.setTimeout(() => {
          item.classList.add("is-shown")
        }, 250 + index * 400)
      })

      observer.unobserve(group)
    })
  }, {
    rootMargin: "75px 0px -75px 0px",
  })

  numberGroups.forEach((group) => {
    numbersObserver.observe(group)
  })
}

const initHowItWorksHeroAnimation = () => {
  const heroContainer = document.querySelector<HTMLElement>("[data-how-it-works-hero]")
  if (!heroContainer || heroContainer.dataset.animationReady === "true") return

  heroContainer.dataset.animationReady = "true"

  void Promise.all([
    import("lottie-web"),
    import("./assets/how-it-works-hero-lottie.json"),
  ]).then(([{ default: lottie }, { default: animationData }]) => {
    const animation = lottie.loadAnimation({
      container: heroContainer,
      renderer: "svg",
      loop: true,
      autoplay: false,
      animationData,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
      },
    }) as LottieAnimation

    if (!("IntersectionObserver" in window)) {
      animation.play()
      return
    }

    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (animation.isPaused) animation.play()
          return
        }

        if (!animation.isPaused) animation.pause()
      })
    }, {
      rootMargin: "75px 0px -75px 0px",
    })

    heroObserver.observe(heroContainer)
  }).catch(() => {
    heroContainer.dataset.animationReady = "false"
  })
}

export const initHowItWorksPage = () => {
  initHowItWorksRevealAnimations()
  initHowItWorksHeroAnimation()
}
