<template>
  <transition
    enter-active-class="transition-opacity duration-[250ms] ease-out"
    enter-from-class="opacity-0"
    leave-active-class="transition-opacity duration-[250ms] ease-out"
    leave-to-class="opacity-0">
    <div
      v-if="visible"
      class="fixed inset-0 z-[300] flex items-center justify-center bg-[rgba(0,0,0,0.5)] px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title">
      <div class="w-full max-w-[500px] overflow-hidden rounded-[6px] bg-white shadow-[0_0_10px_rgba(0,0,0,0.75)]">
        <div class="bg-[linear-gradient(128deg,#2287c8_35%,#1f72ae_95%)] px-6 py-4 text-white">
          <img :src="logoWhiteUrl" alt="SteelTrace Logo" class="h-auto w-full max-w-[250px]">
        </div>

        <div class="h-[400px] overflow-auto px-6 py-5 text-[#333132]">
          <div v-if="!manageMode" class="space-y-4">
            <p class="text-[1rem] leading-[1.65]">
              We use cookies to improve the security of our website, identify areas for enhancements, and better help our customers.
              See our <a :href="privacyUrl" target="_blank" rel="noreferrer" class="text-[#283339] underline underline-offset-4 transition-colors hover:text-[#01466c]">Privacy Statement</a> for details.
            </p>

            <p class="text-[1rem] leading-[1.65]">
              You can choose to accept all cookies, or manage cookies.
            </p>

            <section class="space-y-2">
              <h4 id="cookie-consent-title" class="text-[1.3rem] font-light text-[#0288D1]">Required / Functional Cookies</h4>
              <p class="text-[1rem] leading-[1.65]">
                These cookies allow us to record your privacy choices, log when you have dismissed our automated newsletter popup, and help ensure security on our various on-site forms.
              </p>
            </section>

            <section class="space-y-2">
              <h4 class="text-[1.3rem] font-light text-[#0288D1]">Analytical / Performance Cookies</h4>
              <p class="text-[1rem] leading-[1.65]">
                These cookies allow us to analyse the usage of our site, so that we can review and improve on the user experience of the site.
                They also allow us to engage with potential customers who submit forms on this site in a proactive and relevant fashion.
                <a :href="privacyCookiesUrl" class="text-[#283339] underline underline-offset-4 transition-colors hover:text-[#01466c]">Learn More</a>
              </p>
            </section>

            <section class="space-y-2">
              <h4 class="text-[1.3rem] font-light text-[#0288D1]">Marketing Cookies</h4>
              <p class="text-[1rem] leading-[1.65]">
                We do not use marketing cookies.
              </p>
            </section>
          </div>

          <div v-else class="space-y-4">
            <h4 id="cookie-consent-title" class="text-[1.3rem] font-light text-[#0288D1]">Manage Cookies</h4>

            <label class="relative block pl-[22px] text-[1rem] leading-[1.65] text-[#333132]">
              <input type="checkbox" checked disabled class="absolute left-0 top-[5px] h-4 w-4 rounded border border-[#b7c7d3] accent-[#0288D1]">
              Required / Functional Cookies (Always Active)
              <br>
              <small class="text-[0.9rem] leading-[1.6] text-[#333132]">
                These cookies allow us to record your privacy choices, log when you have dismissed our automated newsletter popup, and help ensure security on our various on-site forms.
              </small>
            </label>

            <label class="relative mt-4 block pl-[22px] text-[1rem] leading-[1.65] text-[#333132]">
              <input v-model="analyticalConsent" type="checkbox" class="absolute left-0 top-[5px] h-4 w-4 rounded border border-[#b7c7d3] accent-[#0288D1]">
              Analytical / Performance Cookies
              <br>
              <small class="text-[0.9rem] leading-[1.6] text-[#333132]">
                These cookies allow us to analyse the usage of our site, so that we can review and improve on the user experience of the site.
                They also allow us to engage with potential customers who submit forms on this site in a proactive and relevant fashion.
                <a :href="privacyCookiesUrl" class="text-[#283339] underline underline-offset-4 transition-colors hover:text-[#01466c]">Learn More</a>
              </small>
            </label>
          </div>
        </div>

        <div class="block bg-[#eee] px-6 py-4">
          <div v-if="!manageMode" class="flex flex-wrap gap-3">
            <button type="button" class="inline-flex rounded-[6px] bg-[#0278b8] px-4 py-2.5 text-[0.96rem] font-medium leading-[1.5] text-white shadow-[1px_3px_5px_rgba(0,0,0,0.2)] transition-colors hover:bg-[#01466c]" @click="acceptAll">
              Accept All
            </button>
            <button type="button" class="inline-flex rounded-[6px] border border-[#0278b8] bg-transparent px-4 py-2.5 text-[0.96rem] font-medium leading-[1.5] text-[#0278b8] transition-colors hover:bg-[#e8f4fb]" @click="manageMode = true">
              Manage...
            </button>
          </div>

          <div v-else class="flex flex-wrap gap-3">
            <button type="button" class="inline-flex rounded-[6px] bg-[#0278b8] px-4 py-2.5 text-[0.96rem] font-medium leading-[1.5] text-white shadow-[1px_3px_5px_rgba(0,0,0,0.2)] transition-colors hover:bg-[#01466c]" @click="acceptAll">
              Accept All
            </button>
            <button type="button" class="inline-flex rounded-[6px] border border-[#0278b8] bg-transparent px-4 py-2.5 text-[0.96rem] font-medium leading-[1.5] text-[#0278b8] transition-colors hover:bg-[#e8f4fb]" @click="confirmSelected">
              Allow Selected
            </button>
            <button type="button" class="inline-flex rounded-[6px] border border-[#0278b8] bg-transparent px-4 py-2.5 text-[0.96rem] font-medium leading-[1.5] text-[#0278b8] transition-colors hover:bg-[#e8f4fb]" @click="allowRequired">
              Allow Required
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue"
import { toSitePath } from "../siteBase"

type ConsentValue = "yes" | "no"

const CONSENT_COOKIE = "tracking_consent"
const LEGACY_STORAGE_KEY = "cookie-consent"
const logoWhiteUrl = toSitePath("dist/images/logo_white.svg")
const privacyUrl = toSitePath("privacy/")
const privacyCookiesUrl = `${privacyUrl}#cookies`
const visible = ref(false)
const manageMode = ref(false)
const analyticalConsent = ref(false)

const trackingCookies = [
  "mtc_id",
  "mtc_sid",
  "mautic_device_id",
  "mautic_referer_id",
  "uid_ms",
  "_clck",
  "_clsk",
  "path",
]

function getCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`))

  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function removeCookie(name: string) {
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
}

function clearTrackingCookies() {
  for (const name of trackingCookies) {
    removeCookie(name)
  }

  document.cookie.split("; ").forEach((entry) => {
    const [rawName] = entry.split("=")
    const name = rawName?.trim()
    if (name?.startsWith("_pk_")) {
      removeCookie(name)
    }
  })
}

function resetDialogState() {
  manageMode.value = false
  analyticalConsent.value = false
}

function emitConsentChange(value: ConsentValue) {
  window.dispatchEvent(new CustomEvent("tracking-consent-change", {
    detail: { value },
  }))
}

function showConsent() {
  resetDialogState()
  visible.value = true
}

function hideConsent() {
  visible.value = false
}

function acceptAll() {
  setCookie(CONSENT_COOKIE, "yes", 365)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
  hideConsent()
  emitConsentChange("yes")
}

function allowRequired() {
  setCookie(CONSENT_COOKIE, "no", 30)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
  clearTrackingCookies()
  hideConsent()
  emitConsentChange("no")
}

function confirmSelected() {
  if (analyticalConsent.value) {
    acceptAll()
    return
  }

  allowRequired()
}

function handleReset() {
  showConsent()
}

function migrateLegacyConsent() {
  if (getCookie(CONSENT_COOKIE)) return

  const saved = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (saved === "accepted") {
    setCookie(CONSENT_COOKIE, "yes", 365)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    return
  }

  if (saved === "declined") {
    setCookie(CONSENT_COOKIE, "no", 30)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  }
}

watch(visible, (isVisible) => {
  document.body.style.overflow = isVisible ? "hidden" : ""
})

onMounted(() => {
  migrateLegacyConsent()

  const savedConsent = getCookie(CONSENT_COOKIE)
  if (!savedConsent) {
    showConsent()
  } else if (savedConsent === "yes" || savedConsent === "no") {
    emitConsentChange(savedConsent)
  }

  window.addEventListener("cookie-consent-reset", handleReset)
})

onBeforeUnmount(() => {
  document.body.style.overflow = ""
  window.removeEventListener("cookie-consent-reset", handleReset)
})
</script>
