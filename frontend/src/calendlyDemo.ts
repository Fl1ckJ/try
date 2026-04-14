interface CalendlyApi {
  initInlineWidget(options: {
    url: string
    parentElement: HTMLElement
    prefill: Record<string, string>
    utm: Record<string, string>
  }): void
}

declare global {
  interface Window {
    Calendly?: CalendlyApi
  }
}

const CALENDLY_SCRIPT_ID = "site-calendly-script"
const CALENDLY_SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js"

let calendlyScriptPromise: Promise<void> | undefined

const isCalendlyEvent = (value: unknown): value is { event: string } => {
  if (typeof value !== "object" || value === null || !("event" in value)) return false

  const eventName = (value as { event: unknown }).event
  return typeof eventName === "string" && eventName.startsWith("calendly")
}

const loadCalendlyScript = async (): Promise<void> => {
  if (window.Calendly) return
  if (calendlyScriptPromise) return calendlyScriptPromise

  calendlyScriptPromise = new Promise<void>((resolve, reject) => {
    const resolveWhenReady = () => {
      if (window.Calendly) {
        resolve()
        return
      }

      calendlyScriptPromise = undefined
      reject(new Error("Calendly failed to initialize."))
    }

    const rejectWithReset = () => {
      calendlyScriptPromise = undefined
      reject(new Error("Calendly failed to load."))
    }

    const existingScript = document.getElementById(CALENDLY_SCRIPT_ID)
    if (existingScript instanceof HTMLScriptElement) {
      existingScript.addEventListener("load", resolveWhenReady, { once: true })
      existingScript.addEventListener("error", rejectWithReset, { once: true })
      return
    }

    const script = document.createElement("script")
    script.id = CALENDLY_SCRIPT_ID
    script.src = CALENDLY_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.addEventListener("load", resolveWhenReady, { once: true })
    script.addEventListener("error", rejectWithReset, { once: true })
    document.head.append(script)
  })

  return calendlyScriptPromise
}

export const initCalendlyDemo = () => {
  const widgetMounts = Array.from(document.querySelectorAll<HTMLElement>("[data-calendly-demo]"))
  if (widgetMounts.length === 0) return

  const roots = widgetMounts.flatMap((mount) => {
    const root = mount.closest("[data-calendly-demo-root]")
    return root instanceof HTMLElement ? [root] : []
  })

  const showCalendly = () => {
    roots.forEach((root) => {
      root.classList.add("shown")
    })
  }

  window.addEventListener("message", (event: MessageEvent<unknown>) => {
    if (!isCalendlyEvent(event.data)) return
    if (event.data.event !== "calendly.event_type_viewed") return

    showCalendly()
  })

  void loadCalendlyScript().then(() => {
    const calendly = window.Calendly
    if (!calendly) return

    widgetMounts.forEach((mount) => {
      if (mount.dataset.calendlyInitialized === "true") return

      const url = mount.dataset.calendlyUrl
      if (!url) return

      mount.dataset.calendlyInitialized = "true"

      calendly.initInlineWidget({
        url,
        parentElement: mount,
        prefill: {},
        utm: {},
      })
    })
  }).catch(() => {
    roots.forEach((root) => {
      const message = root.querySelector<HTMLElement>("[data-calendly-loader-text]")
      if (message) {
        message.textContent = "Calendar failed to load. Please refresh and try again."
      }
    })
  })
}
