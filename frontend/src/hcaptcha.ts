export type HcaptchaWidgetId = string | number

export interface HcaptchaApi {
  render(container: string | HTMLElement, params: { sitekey: string }): HcaptchaWidgetId
  getResponse(widgetId?: HcaptchaWidgetId): string
  reset(widgetId?: HcaptchaWidgetId): void
}

declare global {
  interface Window {
    hcaptcha?: HcaptchaApi
  }
}

const HCAPTCHA_SCRIPT_ID = "site-hcaptcha-script"
const HCAPTCHA_SCRIPT_SRC = "https://js.hcaptcha.com/1/api.js?render=explicit"

let hcaptchaScriptPromise: Promise<void> | undefined

export const loadHcaptchaScript = async (): Promise<void> => {
  if (window.hcaptcha) return
  if (hcaptchaScriptPromise) return hcaptchaScriptPromise

  hcaptchaScriptPromise = new Promise<void>((resolve, reject) => {
    const resolveWhenReady = () => {
      if (window.hcaptcha) {
        resolve()
        return
      }

      hcaptchaScriptPromise = undefined
      reject(new Error("hCaptcha failed to initialize."))
    }

    const rejectWithReset = () => {
      hcaptchaScriptPromise = undefined
      reject(new Error("hCaptcha failed to load."))
    }

    const existingScript = document.getElementById(HCAPTCHA_SCRIPT_ID)
    if (existingScript instanceof HTMLScriptElement) {
      existingScript.addEventListener("load", resolveWhenReady, { once: true })
      existingScript.addEventListener("error", rejectWithReset, { once: true })
      return
    }

    const script = document.createElement("script")
    script.id = HCAPTCHA_SCRIPT_ID
    script.src = HCAPTCHA_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.addEventListener("load", resolveWhenReady, { once: true })
    script.addEventListener("error", rejectWithReset, { once: true })
    document.head.append(script)
  })

  return hcaptchaScriptPromise
}

export const hideMessage = (element: Element | null) => {
  if (!element) return
  element.textContent = ""
  element.classList.add("hidden")
}

export const showMessage = (element: Element | null, message: string) => {
  if (!element) return
  element.textContent = message
  element.classList.remove("hidden")
}
