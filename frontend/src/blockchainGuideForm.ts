import { type HcaptchaWidgetId, hideMessage, loadHcaptchaScript, showMessage } from "./hcaptcha"

export const initBlockchainGuideForm = () => {
  const modal = document.getElementById("blockchain-guide-modal")
  const form = document.getElementById("mauticform_downloadtheblockchainguide")
  const submitButton = document.getElementById("mauticform_input_downloadtheblockchainguide_verify_and_submit")
  const consentCheckbox = document.getElementById("mauticform_downloadtheblockchainguide_checkboxgrp_checkbox_consent_0")
  const captchaTarget = document.getElementById("mauticform_downloadtheblockchainguide_hcaptcha")

  if (!(modal instanceof HTMLDivElement)) return
  if (!(form instanceof HTMLFormElement)) return
  if (!(submitButton instanceof HTMLButtonElement)) return
  if (!(captchaTarget instanceof HTMLDivElement)) return
  if (form.dataset.guideInitialized === "true") return

  form.dataset.guideInitialized = "true"

  const consentError = form.querySelector("#mauticform_downloadtheblockchainguide_consent .mauticform-errormsg")
  const captchaError = document.getElementById("mauticform_downloadtheblockchainguide_hcaptcha_error")
  const hiddenFieldContainer = document.getElementById("mauticform_downloadtheblockchainguide_tralala")
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
  }

  const closeModal = () => {
    modal.classList.add("hidden")
    modal.classList.remove("flex")
    modal.setAttribute("aria-hidden", "true")
    document.body.classList.remove("overflow-hidden")
  }

  document.querySelectorAll<HTMLElement>("[data-open-blockchain-guide]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault()
      openModal()
    })
  })

  modal.querySelectorAll<HTMLElement>("[data-close-blockchain-guide]").forEach((trigger) => {
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

    try {
      const response = await fetch("/hcaptcha", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: new URLSearchParams({
          hCaptchaResponse,
        }),
      })

      const responseText = await response.text()
      const payload = JSON.parse(responseText) as {
        message?: string
        success?: boolean
      }

      window.hcaptcha.reset(widgetId)

      if (payload.success === true) {
        if (hiddenFieldContainer) {
          const hiddenInput = document.createElement("input")
          hiddenInput.type = "hidden"
          hiddenInput.name = "mauticform[hcdone]"
          hiddenInput.value = "bleh"
          hiddenFieldContainer.append(hiddenInput)
        }

        form.submit()
        return
      }

      showMessage(captchaError, payload.message ?? "Error processing hCaptcha. Please try again.")
    } catch {
      showMessage(captchaError, "Error checking hCaptcha. Please try again.")

      if (window.hcaptcha && widgetId !== undefined) {
        window.hcaptcha.reset(widgetId)
      }
    } finally {
      submitButton.disabled = false
    }
  })
}
