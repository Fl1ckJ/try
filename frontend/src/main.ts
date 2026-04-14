import { createApp, type Component } from "vue"
import { initBlockchainGuideForm } from "./blockchainGuideForm"
import { initCalendlyDemo } from "./calendlyDemo"
import CookieConsent from "./components/CookieConsent.vue"
import { initContactForm } from "./contactForm"
import { initHowItWorksPage } from "./howItWorks"
import { initNewsletterForm } from "./newsletterForm"
import { initProductBrochureForm } from "./productBrochureForm"
import { toSitePath } from "./siteBase"
import { initWeeklyDemoForm } from "./weeklyDemoForm"
import "./styles/app.css"
import "./styles/demo.scss"
import "./styles/home.scss"
import "./styles/how-it-works.scss"
import "./styles/solutions.scss"
import StatsCounter from "./components/StatsCounter.vue"
import SolutionDetailPageMount from "./components/SolutionDetailPageMount.vue"
import SolutionsPageMount from "./components/SolutionsPageMount.vue"

document.addEventListener("DOMContentLoaded", () => {
  const contactPathname = new URL(toSitePath("contact/"), window.location.origin).pathname.replace(/\/$/, "")
  const demoPathname = new URL(toSitePath("demo/"), window.location.origin).pathname.replace(/\/$/, "")

  initBlockchainGuideForm()
  initCalendlyDemo()
  initContactForm()
  initHowItWorksPage()
  initNewsletterForm()
  initProductBrochureForm()
  initWeeklyDemoForm()

  document.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
    const href = link.getAttribute("href")
    if (href === "#book-demo") {
      link.href = toSitePath("demo/#book-demo")
      return
    }

    if (!href) return

    let pathname = ""
    try {
      pathname = new URL(href, window.location.origin).pathname.replace(/\/$/, "")
    } catch {
      return
    }

    if (pathname !== contactPathname && pathname !== demoPathname) return

    const text = link.textContent?.trim().replace(/\s+/g, " ") ?? ""
    const ariaLabel = link.getAttribute("aria-label")?.trim() ?? ""
    const imageAlt = link.querySelector("img")?.getAttribute("alt")?.trim() ?? ""
    const combinedLabel = `${text} ${ariaLabel} ${imageAlt}`.trim()

    if (/get a demo|book a demo|choose date and time/i.test(combinedLabel)) {
      link.href = toSitePath("demo/#book-demo")
    }
  })

  document.querySelectorAll<HTMLElement>("[data-cookie-consent-reset]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault()
      window.dispatchEvent(new Event("cookie-consent-reset"))
    })
  })

  const hamburger = document.getElementById("hamburger")
  const megaMenu = document.getElementById("mega-menu")
  const overlay = document.getElementById("overlay")

  const menuOpenClasses = ["pointer-events-auto", "visible", "translate-y-0", "opacity-100", "duration-[250ms]"]
  const menuClosingClasses = ["pointer-events-none", "visible", "translate-y-5", "opacity-0", "duration-[500ms]"]
  const menuClosedClasses = ["pointer-events-none", "invisible", "translate-y-5", "opacity-0"]
  const overlayOpenClasses = ["pointer-events-auto", "visible", "opacity-100"]
  const overlayClosedClasses = ["pointer-events-none", "invisible", "opacity-0"]
  let closeTimer: number | undefined

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add("is-shown")
        observer.unobserve(entry.target)
      })
    }, {
      rootMargin: "75px 0px -75px 0px"
    })

    document.querySelectorAll<HTMLElement>(".reveal-image").forEach((el) => {
      revealObserver.observe(el)
    })
  } else {
    document.querySelectorAll<HTMLElement>(".reveal-image").forEach((el) => {
      el.classList.add("is-shown")
    })
  }

  if (!(hamburger instanceof HTMLButtonElement) || !megaMenu) return
  const hamburgerCloseClass = hamburger.dataset.closeClass ?? "text-white"

  const swapClasses = (element: Element, add: string[], remove: string[]) => {
    element.classList.remove(...remove)
    element.classList.add(...add)
  }

  const stopClosing = () => {
    if (closeTimer) {
      window.clearTimeout(closeTimer)
      closeTimer = undefined
    }
    megaMenu.classList.remove(...menuClosingClasses)
  }

  const closeMenu = () => {
    hamburger.classList.remove("is-open")
    hamburger.classList.remove("text-[#f54e7c]")
    hamburger.classList.remove("text-white", "text-[#888]")
    hamburger.classList.add(hamburgerCloseClass)
    stopClosing()
    swapClasses(megaMenu, menuClosingClasses, [...menuOpenClasses, ...menuClosedClasses])
    if (overlay) {
      swapClasses(overlay, overlayClosedClasses, overlayOpenClasses)
    }
    hamburger.setAttribute("aria-expanded", "false")
    closeTimer = window.setTimeout(() => {
      swapClasses(megaMenu, menuClosedClasses, menuClosingClasses)
    }, 500)
  }

  const openMenu = () => {
    stopClosing()
    hamburger.classList.add("is-open")
    hamburger.classList.remove("text-white", "text-[#888]")
    hamburger.classList.add("text-[#f54e7c]")
    swapClasses(megaMenu, menuOpenClasses, [...menuClosedClasses, ...menuClosingClasses])
    if (overlay) {
      swapClasses(overlay, overlayOpenClasses, overlayClosedClasses)
    }
    hamburger.setAttribute("aria-expanded", "true")
  }

  hamburger.addEventListener("click", () => {
    hamburger.classList.contains("is-open") ? closeMenu() : openMenu()
  })

  overlay?.addEventListener("click", closeMenu)

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape") closeMenu()
  })

  megaMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu)
  })
})


const registry: Record<string, Component> = {
  CookieConsent,
  SolutionDetailPageMount,
  StatsCounter,
  SolutionsPageMount,
}
document.querySelectorAll<HTMLElement>("[data-vue]").forEach((el) => {
  const name = el.dataset.vue
  if (!name) return

  const Component = registry[name]
  if (!Component) return

  let props = {}

  if (el.dataset.props) {
    try {
      props = JSON.parse(el.dataset.props)
    } catch {
      console.warn("Invalid JSON props")
    }
  }

  createApp(Component, props).mount(el)
})
