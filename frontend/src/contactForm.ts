import { type HcaptchaWidgetId, hideMessage, loadHcaptchaScript, showMessage } from "./hcaptcha"
import { submitMauticFormAndRedirect } from "./mauticSubmit"

export const initContactForm = () => {
  const form = document.getElementById("mauticform_contact")
  const submitButton = document.getElementById("mauticform_input_contact_verify_and_submit")
  const consentCheckbox = document.getElementById("mauticform_contact_checkboxgrp_checkbox_consent_0")
  const captchaTarget = document.getElementById("mauticform_contact_hcaptcha")

  if (!(form instanceof HTMLFormElement)) return
  if (!(submitButton instanceof HTMLButtonElement)) return
  if (!(captchaTarget instanceof HTMLDivElement)) return
  if (form.dataset.contactInitialized === "true") return

  form.dataset.contactInitialized = "true"

  const consentError = form.querySelector("#mauticform_contact_consent .mauticform-errormsg")
  const captchaError = document.getElementById("mauticform_contact_hcaptcha_error")
  const hiddenFieldContainer = document.getElementById("mauticform_contact_tralala")
  const sitekey = captchaTarget.dataset.sitekey
  let widgetId: HcaptchaWidgetId | undefined

  const renderCaptcha = async () => {
    if (widgetId !== undefined) return true

    if (!sitekey) {
      showMessage(captchaError, "Captcha configuration is missing.")
      return false
    }

    try {
      await loadHcaptchaScript()
    } catch {
      showMessage(captchaError, "Captcha failed to load. Please refresh and try again.")
      return false
    }

    if (!window.hcaptcha) {
      showMessage(captchaError, "Captcha failed to load. Please refresh and try again.")
      return false
    }

    widgetId = window.hcaptcha.render(captchaTarget, { sitekey })
    return true
  }

  void renderCaptcha()

  submitButton.addEventListener("click", async (event) => {
    event.preventDefault()

    form.querySelectorAll(".mauticform-errormsg").forEach((element) => {
      hideMessage(element)
    })

    if (hiddenFieldContainer) {
      hiddenFieldContainer.replaceChildren()
    }

    if (!(consentCheckbox instanceof HTMLInputElement) || !consentCheckbox.checked) {
      showMessage(consentError, "Please confirm your consent.")
      return
    }

    const captchaReady = await renderCaptcha()
    if (!captchaReady || !window.hcaptcha || widgetId === undefined) {
      showMessage(captchaError, "Captcha is still loading. Please try again.")
      return
    }

    const hCaptchaResponse = window.hcaptcha.getResponse(widgetId)
    if (!hCaptchaResponse) {
      showMessage(captchaError, "Please complete the captcha.")
      return
    }

    submitButton.disabled = true

    const hcdoneField = form.querySelector<HTMLInputElement>('input[name="mauticform[hcdone]"]')

    if (hcdoneField) {
      hcdoneField.value = "bleh"
    } else {
      const hiddenInput = document.createElement("input")
      hiddenInput.type = "hidden"
      hiddenInput.name = "mauticform[hcdone]"
      hiddenInput.value = "bleh"

      if (hiddenFieldContainer) {
        hiddenFieldContainer.append(hiddenInput)
      } else {
        form.append(hiddenInput)
      }
    }

    await submitMauticFormAndRedirect(form)
  })
}
