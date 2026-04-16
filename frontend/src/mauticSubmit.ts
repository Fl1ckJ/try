import { toSitePath } from "./siteBase"

const redirectPath = "form/message/"
const fallbackRedirectDelay = 1200

const getRedirectUrl = () => new URL(toSitePath(redirectPath), window.location.origin).toString()

const setReturnUrl = (form: HTMLFormElement, redirectUrl: string) => {
  const returnField = form.querySelector<HTMLInputElement>('input[name="mauticform[return]"]')
  if (returnField) {
    returnField.value = redirectUrl
  }
}

const submitWithHiddenFrame = (form: HTMLFormElement, redirectUrl: string) => {
  const frameName = `mautic-submit-${form.id || "form"}`
  let frame = document.querySelector<HTMLIFrameElement>(`iframe[name="${frameName}"]`)

  if (!frame) {
    frame = document.createElement("iframe")
    frame.name = frameName
    frame.title = "Form submission"
    frame.tabIndex = -1
    frame.setAttribute("aria-hidden", "true")
    frame.className = "hidden"
    document.body.append(frame)
  }

  let redirected = false
  const redirect = () => {
    if (redirected) return
    redirected = true
    window.location.assign(redirectUrl)
  }

  frame.addEventListener("load", redirect, { once: true })
  form.target = frameName
  form.submit()
  window.setTimeout(redirect, fallbackRedirectDelay)
}

export const submitMauticFormAndRedirect = async (form: HTMLFormElement) => {
  const redirectUrl = getRedirectUrl()
  setReturnUrl(form, redirectUrl)

  try {
    await fetch(form.action, {
      body: new FormData(form),
      credentials: "include",
      method: form.method || "POST",
      mode: "no-cors",
    })

    window.location.assign(redirectUrl)
  } catch {
    submitWithHiddenFrame(form, redirectUrl)
  }
}
