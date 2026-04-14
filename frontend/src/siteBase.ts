const normalizeBasePath = (value: string | undefined): string => {
  if (!value) return "/"

  const trimmed = value.trim()
  if (!trimmed || trimmed === "/") return "/"

  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`
}

export const getSiteBasePath = (): string => {
  if (typeof document === "undefined") return "/"
  return normalizeBasePath(document.body.dataset.siteBase)
}

export const toSitePath = (path: string): string => {
  const basePath = getSiteBasePath()
  const normalizedPath = path.replace(/^\/+/, "")

  if (!normalizedPath) return basePath
  if (basePath === "/") return `/${normalizedPath}`

  return `${basePath}${normalizedPath}`
}
