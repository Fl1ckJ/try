import { type HcaptchaWidgetId, hideMessage, loadHcaptchaScript, showMessage } from "./hcaptcha"
import { submitMauticFormAndRedirect } from "./mauticSubmit"

export const initNewsletterForm = () => {
  const modal = document.getElementById("newsletter-modal")
  const form = document.getElementById("mauticform_newsletter")
  const submitButton = document.getElementById("mauticform_input_newsletter_verify_and_submit")
  const consentCheckbox = document.getElementById("mauticform_newsletter_checkboxgrp_checkbox_consent_0")
  const captchaTarget = document.getElementById("mauticform_newsletter_hcaptcha")
  const firstInput = document.getElementById("mauticform_input_newsletter_email")

  if (!(modal instanceof HTMLDivElement)) return
  if (!(form instanceof HTMLFormElement)) return
  if (!(submitButton instanceof HTMLButtonElement)) return
  if (!(captchaTarget instanceof HTMLDivElement)) return
  if (form.dataset.newsletterInitialized === "true") return

  form.dataset.newsletterInitialized = "true"

  const consentError = form.querySelector("#mauticform_newsletter_consent .mauticform-errormsg")
  const captchaError = document.getElementById("mauticform_newsletter_hcaptcha_error")
  const hiddenFieldContainer = document.getElementById("mauticform_newsletter_tralala")
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

  const openModal = () => {
    modal.classList.remove("hidden")
    modal.classList.add("flex")
    modal.setAttribute("aria-hidden", "false")
    document.body.classList.add("overflow-hidden")
    void renderCaptcha()

    if (firstInput instanceof HTMLInputElement) {
      window.setTimeout(() => {
        firstInput.focus()
      }, 0)
    }
  }

  const closeModal = () => {
    modal.classList.add("hidden")
    modal.classList.remove("flex")
    modal.setAttribute("aria-hidden", "true")
    document.body.classList.remove("overflow-hidden")
  }

  document.querySelectorAll<HTMLElement>("a[href='#newsletter-signup'], a[href='#newsletter'], [data-open-newsletter]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault()
      openModal()
    })
  })

  modal.querySelectorAll<HTMLElement>("[data-close-newsletter]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      closeModal()
    })
  })

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal()
    }
  })

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("flex")) {
      closeModal()
    }
  })

  submitButton.addEventListener("click", async (event) => {
    event.preventDefault()

    form.querySelectorAll(".mauticform-errormsg").forEach((element) => {
      hideMessage(element)
    })

    if (hiddenFieldContainer) {
      hiddenFieldContainer.replaceChildren()
    }

    if (!form.reportValidity()) return

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

    try {
      await submitMauticFormAndRedirect(form, hCaptchaResponse)
    } catch (error) {
      showMessage(captchaError, error instanceof Error ? error.message : "Error submitting form. Please try again.")
      submitButton.disabled = false
      window.hcaptcha.reset(widgetId)
    }
  })
}
