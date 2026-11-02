// Canvas description HTML → safe HTML. Inline styles go (they fight the palette
// and dark mode); links open in a new tab; root-relative Canvas paths are made absolute.
import DOMPurify from 'dompurify'

let base: string | undefined
let hooked = false

function absolutize(value: string | null): string | null {
  if (!value || !base || !value.startsWith('/') || value.startsWith('//')) return value
  try {
    return new URL(value, base).href
  } catch {
    return value
  }
}

function installHook(): void {
  if (hooked) return
  hooked = true
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      node.setAttribute('href', absolutize(node.getAttribute('href')) ?? '')
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noreferrer')
    }
    if (node.tagName === 'IMG' && node.hasAttribute('src')) {
      node.setAttribute('src', absolutize(node.getAttribute('src')) ?? '')
    }
  })
}

/** Sanitized HTML for a description; `canvasUrl` supplies the origin for root-relative links. */
export function sanitizeDescription(html: string | undefined, canvasUrl?: string): string {
  if (!html || !html.trim()) return ''
  installHook()
  try {
    base = canvasUrl ? new URL(canvasUrl).origin : undefined
  } catch {
    base = undefined
  }
  try {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['style', 'font', 'form', 'input', 'button', 'select', 'textarea'],
      FORBID_ATTR: ['style', 'class', 'id'],
    })
  } finally {
    base = undefined
  }
}
