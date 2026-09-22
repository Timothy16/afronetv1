// server/utils/afronetEmailLayout.ts
//
// Shared shell for every Afronet transactional email. Each email passes only
// its inner body HTML; header, footer, preheader and card chrome live here so
// the brand is maintained in one place. Colours mirror the app's tokens.

const BRAND = '#0b5d3e'
const BRAND_SOFT = '#eaf3ee'
const GOLD = '#b07f15'
const INK = '#121614'
const MUTED = '#606863'
const SUBTLE = '#8f9792'
const BORDER = '#e4e4de'
const CANVAS = '#f7f7f4'

// Same asset as the app's BrandMark and tab icon
const LOGO_PATH = '/favicon.png'

export const AFRONET_EMAIL_FROM = 'Afronet <noreply@mail.myschoolacademy.org>'

const FONT_STACK = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif"
const SERIF_STACK = "'Instrument Serif',Georgia,'Times New Roman',serif"

interface AfronetEmailLayoutOptions {
    /** Hidden inbox-preview text shown next to the subject line. */
    preheader: string
    /** Inner body HTML (headings, paragraphs, CTA, etc.). */
    bodyHtml: string
    /** Absolute origin used for the logo; defaults to runtimeConfig.public.appUrl. */
    appUrl?: string
}

/**
 * Wraps body content in the Afronet email shell and returns a full HTML document.
 */
export function renderEmailLayout({ preheader, bodyHtml, appUrl }: AfronetEmailLayoutOptions): string {
    const origin = appUrl || useRuntimeConfig().public.appUrl
    const logoUrl = `${origin}${LOGO_PATH}`
    const year = new Date().getFullYear()

    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="color-scheme" content="light only">
    <title>Afronet</title>
  </head>
  <body style="margin:0;padding:0;background-color:${CANVAS};-webkit-text-size-adjust:100%;">

    <!-- Hidden preheader (controls inbox preview line) -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${CANVAS};font-size:1px;line-height:1px;">
      ${preheader}
      &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CANVAS};">
      <tr>
        <td align="center" style="padding:40px 12px;">

          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${BORDER};">

            <!-- Header -->
            <tr>
              <td style="padding:24px 36px;border-bottom:1px solid ${BORDER};">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:10px;vertical-align:middle;">
                      <img src="${logoUrl}" width="28" height="28" alt="Afronet" style="display:block;border:0;">
                    </td>
                    <td style="vertical-align:middle;font-family:${FONT_STACK};font-size:17px;font-weight:600;letter-spacing:-0.3px;color:${INK};">
                      Afronet
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:36px 36px 32px;font-family:${FONT_STACK};">
                ${bodyHtml}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:24px 36px;background:${CANVAS};border-top:1px solid ${BORDER};">
                <p style="margin:0 0 6px;font-family:${FONT_STACK};font-size:12px;line-height:1.6;color:${MUTED};">
                  One identity. One African network. With or without the internet.
                </p>
                <p style="margin:0 0 4px;font-family:${FONT_STACK};font-size:11px;line-height:1.6;color:${SUBTLE};">
                  If you weren't expecting this email, you can safely ignore it.
                </p>
                <p style="margin:0;font-family:${FONT_STACK};font-size:11px;color:${SUBTLE};">
                  &copy; ${year} Afronet
                </p>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`
}

/** Solid brand CTA button. */
export function emailButton(url: string, label: string): string {
    return `<a href="${url}" target="_blank" style="display:inline-block;background:${BRAND};color:#ffffff;padding:13px 36px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:500;font-family:${FONT_STACK};">${label}</a>`
}

/** Bordered CTA panel (button + small note, centered). */
export function emailCtaPanel(buttonHtml: string, note?: string): string {
    const noteHtml = note
        ? `<p style="margin:14px 0 0;font-family:${FONT_STACK};font-size:12px;color:${SUBTLE};">${note}</p>`
        : ''
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
    <tr>
      <td align="center" style="padding:24px;background:${CANVAS};border:1px solid ${BORDER};border-radius:12px;">
        ${buttonHtml}
        ${noteHtml}
      </td>
    </tr>
  </table>`
}

/** Centered one-time code box (spaced digits, brand border). */
export function emailOtpBox(code: string): string {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="background:${BRAND_SOFT};border:1px solid ${BRAND};border-radius:12px;padding:18px 36px;">
              <span style="font-size:34px;font-weight:600;letter-spacing:10px;color:${BRAND};font-family:'Courier New',Courier,monospace;">${code}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

/** Small gold label above a heading. */
export function emailEyebrow(text: string): string {
    return `<p style="margin:0 0 8px;font-family:${FONT_STACK};font-size:12px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;color:${GOLD};">${text}</p>`
}

/** Serif body heading, matching the app's page titles. */
export function emailHeading(text: string): string {
    return `<h1 style="margin:0 0 14px;font-family:${SERIF_STACK};font-size:30px;font-weight:400;line-height:1.2;color:${INK};">${text}</h1>`
}

/** Standard body paragraph. */
export function emailParagraph(html: string): string {
    return `<p style="margin:0 0 18px;font-family:${FONT_STACK};font-size:15px;line-height:1.65;color:${MUTED};">${html}</p>`
}
