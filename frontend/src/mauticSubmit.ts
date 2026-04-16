import { toSitePath } from "./siteBase"

type BackendResponse = {
  message?: string
  redirect?: string
  success?: boolean
}

const redirectPath = "form/message/"
const fallbackBackendSubmitUrl = "https://mautic-backend.onrender.com/submit"

const getRedirectUrl = () => new URL(toSitePath(redirectPath), window.location.origin).toString()

const getBackendSubmitUrl = () => document.body.dataset.mauticBackendSubmitUrl || fallbackBackendSubmitUrl

const setReturnUrl = (form: HTMLFormElement, redirectUrl: string) => {
  const returnField = form.querySelector<HTMLInputElement>('input[name="mauticform[return]"]')
  if (returnField) {
    returnField.value = redirectUrl
  }
}

const setFormValue = (form: HTMLFormElement, name: string, value: string) => {
  const field = form.querySelector<HTMLInputElement>(`input[name="${name}"]`)
  if (field) {
    field.value = value
    return
  }

  const hiddenInput = document.createElement("input")
  hiddenInput.type = "hidden"
  hiddenInput.name = name
  hiddenInput.value = value
  form.append(hiddenInput)
}

const parseBackendResponse = async (response: Response): Promise<BackendResponse> => {
  try {
    return await response.json() as BackendResponse
  } catch {
    return {}
  }
}

export const submitMauticFormAndRedirect = async (form: HTMLFormElement, hCaptchaResponse: string) => {
  const redirectUrl = getRedirectUrl()
  setReturnUrl(form, redirectUrl)
  setFormValue(form, "h-captcha-response", hCaptchaResponse)
  setFormValue(form, "mauticform[hcdone]", "bleh")

  const response = await fetch(getBackendSubmitUrl(), {
    body: new FormData(form),
    method: "POST",
  })

  const payload = await parseBackendResponse(response)

  if (!response.ok || payload.success !== true) {
    throw new Error(payload.message || "Form submission failed.")
  }

  window.location.assign(payload.redirect || redirectUrl)
}
