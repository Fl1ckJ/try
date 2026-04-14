import { type HcaptchaWidgetId, hideMessage, loadHcaptchaScript, showMessage } from "./hcaptcha"

type WeeklyDemoPayload = {
  company: string
  company_type: string
  consent: boolean
  date: string
  email: string
  first_name: string
  last_name: string
  notes: string
}

type HcaptchaResponse = {
  message?: string
  success?: boolean
}

const inputErrorClass = "border-[#dc3545]"
const ParisTimeZone = "Europe/Paris"
const defaultEvenWeekTime = "09:00"
const defaultOddWeekTime = "16:00"
const defaultSlotCount = 6

type ParisNow = {
  day: number
  hour: number
  minute: number
  month: number
  year: number
}

const ParisFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  hour: "numeric",
  hour12: false,
  minute: "numeric",
  month: "numeric",
  timeZone: ParisTimeZone,
  year: "numeric",
})

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const weekdayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

const parseTimeToMinutes = (value: string) => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return 0

  const hours = Number.parseInt(match[1] ?? "0", 10)
  const minutes = Number.parseInt(match[2] ?? "0", 10)
  return (hours * 60) + minutes
}

const getParisNow = () => {
  const parts = ParisFormatter.formatToParts(new Date())
  const values = parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value
    }
    return acc
  }, {})

  return {
    day: Number.parseInt(values.day ?? "1", 10),
    hour: Number.parseInt(values.hour ?? "0", 10),
    minute: Number.parseInt(values.minute ?? "0", 10),
    month: Number.parseInt(values.month ?? "1", 10),
    year: Number.parseInt(values.year ?? "1970", 10),
  } satisfies ParisNow
}

const createParisDate = (year: number, month: number, day: number) => new Date(Date.UTC(year, month - 1, day))

const getISOWeekNumber = (date: Date) => {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = copy.getUTCDay() || 7
  copy.setUTCDate(copy.getUTCDate() + 4 - day)

  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1))
  return Math.ceil((((copy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

const getWeekTime = (date: Date, evenWeekTime: string, oddWeekTime: string) => {
  const isoWeek = getISOWeekNumber(date)
  return isoWeek % 2 === 0 ? evenWeekTime : oddWeekTime
}

const getDaySuffix = (day: number) => {
  if (day >= 11 && day <= 13) return "th"

  switch (day % 10) {
    case 1:
      return "st"
    case 2:
      return "nd"
    case 3:
      return "rd"
    default:
      return "th"
  }
}

const formatNextUpLabel = (date: Date) => {
  const day = date.getUTCDate()
  const month = monthNames[date.getUTCMonth()]
  const year = date.getUTCFullYear()
  const weekday = weekdayNames[date.getUTCDay()]

  return `${weekday}, ${day}${getDaySuffix(day)} of ${month} ${year}`
}

const formatSlotText = (date: Date, time: string) => `${formatNextUpLabel(date)} Start time: ${time}`

const formatSlotValue = (date: Date) => {
  const day = String(date.getUTCDate()).padStart(2, "0")
  const month = String(date.getUTCMonth() + 1)
  const year = String(date.getUTCFullYear())

  return `${day}-${month}-${year}`
}

const buildUpcomingThursdaySlots = (slotCount: number, evenWeekTime: string, oddWeekTime: string) => {
  const now = getParisNow()
  const today = createParisDate(now.year, now.month, now.day)
  const currentMinutes = (now.hour * 60) + now.minute
  const first = new Date(today)
  const daysUntilThursday = (4 - first.getUTCDay() + 7) % 7
  first.setUTCDate(first.getUTCDate() + daysUntilThursday)

  if (daysUntilThursday === 0) {
    const todayTime = getWeekTime(first, evenWeekTime, oddWeekTime)
    if (currentMinutes >= parseTimeToMinutes(todayTime)) {
      first.setUTCDate(first.getUTCDate() + 7)
    }
  }

  return Array.from({ length: Math.max(slotCount, 1) }, (_, index) => {
    const date = new Date(first)
    date.setUTCDate(first.getUTCDate() + (index * 7))
    const time = getWeekTime(date, evenWeekTime, oddWeekTime)

    return {
      label: formatSlotText(date, time),
      nextUp: formatNextUpLabel(date),
      value: formatSlotValue(date),
    }
  })
}

export const initWeeklyDemoForm = () => {
  const form = document.getElementById("weekly-demo-form")
  const captchaTarget = document.getElementById("weekly_demo_hcaptcha")
  const submitButton = document.getElementById("weekly_demo_submit")
  const successMessage = document.getElementById("weekly_demo_message")
  const formError = document.getElementById("weekly_demo_error")
  const captchaError = document.getElementById("weekly_demo_hcaptcha_error")
  const nextUpTarget = document.getElementById("weekly_demo_next_up_value")
  const hiddenFieldContainer = document.getElementById("weekly_demo_tralala")

  if (!(form instanceof HTMLFormElement)) return
  if (!(submitButton instanceof HTMLButtonElement)) return
  if (form.dataset.weeklyDemoInitialized === "true") return

  form.dataset.weeklyDemoInitialized = "true"

  const hasCaptcha = captchaTarget instanceof HTMLDivElement
  const sitekey = hasCaptcha ? captchaTarget.dataset.sitekey : undefined
  const evenWeekTime = form.dataset.weeklyEvenWeekTime?.trim() || defaultEvenWeekTime
  const oddWeekTime = form.dataset.weeklyOddWeekTime?.trim() || defaultOddWeekTime
  const slotCount = Number.parseInt(form.dataset.weeklySlotCount ?? "", 10) || defaultSlotCount
  let widgetId: HcaptchaWidgetId | undefined

  const fields = {
    first_name: {
      input: document.getElementById("weekly_demo_input_first_name"),
      row: document.getElementById("weekly_demo_first_name"),
    },
    last_name: {
      input: document.getElementById("weekly_demo_input_last_name"),
      row: document.getElementById("weekly_demo_last_name"),
    },
    email: {
      input: document.getElementById("weekly_demo_input_email"),
      row: document.getElementById("weekly_demo_email"),
    },
    date: {
      input: document.getElementById("weekly_demo_input_date"),
      row: document.getElementById("weekly_demo_date"),
    },
    company: {
      input: document.getElementById("weekly_demo_input_company"),
      row: document.getElementById("weekly_demo_company"),
    },
    company_type: {
      input: document.getElementById("weekly_demo_input_company_type"),
      row: document.getElementById("weekly_demo_company_type"),
    },
    notes: {
      input: document.getElementById("weekly_demo_input_notes"),
      row: document.getElementById("weekly_demo_notes"),
    },
    consent: {
      input: document.getElementById("weekly_demo_input_consent"),
      row: document.getElementById("weekly_demo_consent"),
    },
  } as const

  const fieldNames = Object.keys(fields) as Array<keyof typeof fields>

  const populateDateOptions = () => {
    const dateSelect = fields.date.input
    if (!(dateSelect instanceof HTMLSelectElement)) return

    const placeholder = dateSelect.querySelector("option[value='']")
    dateSelect.querySelectorAll("option:not([value=''])").forEach((option) => {
      option.remove()
    })

    const slots = buildUpcomingThursdaySlots(slotCount, evenWeekTime, oddWeekTime)

    slots.forEach((slot) => {
      const option = document.createElement("option")
      option.value = slot.value
      option.textContent = slot.label
      dateSelect.append(option)
    })

    if (placeholder instanceof HTMLOptionElement) {
      dateSelect.value = placeholder.value
    }

    if (nextUpTarget) {
      nextUpTarget.textContent = slots[0]?.nextUp ?? ""
    }
  }

  const getFieldMessage = (field: keyof typeof fields) => fields[field].row?.querySelector("[data-weekly-error]")

  const clearFieldError = (field: keyof typeof fields) => {
    const element = fields[field].input
    if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
      element.classList.remove(inputErrorClass)
    }
    hideMessage(getFieldMessage(field) ?? null)
  }

  const setFieldError = (field: keyof typeof fields, message: string) => {
    const element = fields[field].input
    if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
      element.classList.add(inputErrorClass)
    }
    showMessage(getFieldMessage(field) ?? null, message)
  }

  const clearAllFieldErrors = () => {
    fieldNames.forEach(clearFieldError)
    hideMessage(formError)
    hideMessage(successMessage)
    hideMessage(captchaError)
  }

  const renderCaptcha = async () => {
    if (!hasCaptcha) return true
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

  const readTextValue = (value: typeof fields[keyof typeof fields]["input"]) => {
    if (value instanceof HTMLInputElement || value instanceof HTMLTextAreaElement || value instanceof HTMLSelectElement) {
      return value.value.trim()
    }
    return ""
  }

  const buildPayload = (): WeeklyDemoPayload => ({
    company: readTextValue(fields.company.input),
    company_type: readTextValue(fields.company_type.input),
    consent: fields.consent.input instanceof HTMLInputElement ? fields.consent.input.checked : false,
    date: fields.date.input instanceof HTMLSelectElement
      ? fields.date.input.value.trim()
      : readTextValue(fields.date.input),
    email: readTextValue(fields.email.input),
    first_name: readTextValue(fields.first_name.input),
    last_name: readTextValue(fields.last_name.input),
    notes: readTextValue(fields.notes.input),
  })

  const validatePayload = (payload: WeeklyDemoPayload) => {
    let valid = true

    if (!payload.first_name) {
      setFieldError("first_name", "This is required.")
      valid = false
    }

    if (!payload.last_name) {
      setFieldError("last_name", "This is required.")
      valid = false
    }

    if (!payload.email) {
      setFieldError("email", "This is required.")
      valid = false
    } else if (!(fields.email.input instanceof HTMLInputElement) || !fields.email.input.validity.valid) {
      setFieldError("email", "Please enter a valid email address.")
      valid = false
    }

    if (!payload.date) {
      setFieldError("date", "This is required.")
      valid = false
    }

    if (!payload.company) {
      setFieldError("company", "This is required.")
      valid = false
    }

    if (!payload.consent) {
      setFieldError("consent", "Please confirm your consent.")
      valid = false
    }

    return valid
  }

  fieldNames.forEach((field) => {
    const element = fields[field].input
    if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement) && !(element instanceof HTMLSelectElement)) return

    const eventName = element instanceof HTMLSelectElement ? "change" : "input"
    element.addEventListener(eventName, () => {
      clearFieldError(field)
    })
  })

  populateDateOptions()
  if (hasCaptcha) {
    void renderCaptcha()
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault()
    clearAllFieldErrors()
    if (hiddenFieldContainer) {
      hiddenFieldContainer.replaceChildren()
    }

    const payload = buildPayload()
    const valid = validatePayload(payload)

    if (!valid) return

    submitButton.disabled = true

    try {
      if (hasCaptcha) {
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
        const data = JSON.parse(responseText) as HcaptchaResponse

        window.hcaptcha.reset(widgetId)

        if (!response.ok || data.success !== true) {
          showMessage(captchaError, data.message ?? "Error processing hCaptcha. Please try again.")
          return
        }
      }

      if (hiddenFieldContainer) {
        const hiddenInput = document.createElement("input")
        hiddenInput.type = "hidden"
        hiddenInput.name = "mauticform[hcdone]"
        hiddenInput.value = "bleh"
        hiddenFieldContainer.append(hiddenInput)
      }

      form.submit()
    } catch {
      if (window.hcaptcha && widgetId !== undefined) {
        window.hcaptcha.reset(widgetId)
      }

      showMessage(captchaError, "Error checking hCaptcha. Please try again.")
    } finally {
      submitButton.disabled = false
    }
  })
}
