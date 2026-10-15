// server/utils/devApps.ts
//
// What a build is, and what a new one looks like.
//
// This file used to seed six sample builds into every new account and guess which of ten
// templates a description meant. Both are gone: apps are generated from the description now,
// so there is no shape to guess, and a Studio that starts empty is telling the truth.
//
// What is left is the record itself — the server decides what a new build looks like, rather
// than accepting one the browser assembled.

import { randomUUID } from 'node:crypto'

export const defaultBuildConfig = {
  prompt: '',
  fontScale: 'normal',
  saveProgress: true,
  tone: 'brand',
  layout: 'cards',
  highContrast: false,
  /**
   * Whether this app reaches a service of its own. Always false today — nothing generated can
   * leave the sandbox — and it is the hook the permission is derived from when something can.
   */
  externalApi: false,
}

// What a build needs a connection for is worked out in storeListing.ts, next to the permissions
// it decides. There was a second copy here, which Nitro auto-imported and then had to pick
// between — one definition, in the file that acts on it.

/**
 * A short description, from what someone typed.
 *
 * People describe an app in a sentence about themselves — "I need an app that can help me
 * draft emails" — and the store needs a phrase about the app. Cutting the sentence to length
 * leaves a listing that reads "…that can help draft emails via descr", so the asking part is
 * dropped and what is left is tidied to a whole word.
 */
export function taglineFromPrompt(prompt: string) {
    const said = String(prompt ?? '').trim()
    if (!said) return ''

    const stripped = said
        // "I want to build an app that helps me…", "Create an application which can…"
        .replace(/^\s*(i\s+(?:want|need|would\s+like|wish)\s+(?:to\s+)?(?:create|build|make|have)?\s*)/i, '')
        .replace(/^\s*(?:please\s+)?(?:create|build|make)\s+/i, '')
        .replace(/^\s*(?:an?|the)\s+(?:app|application|tool)\b\s*/i, '')
        .replace(/^\s*(?:that|which|to)\s+/i, '')
        .replace(/^\s*(?:can\s+)?(?:help|helps|lets|let)\s+(?:me\s+|you\s+|us\s+|people\s+|students\s+)?/i, '')
        .replace(/^\s*(?:app|application)\s+(?:for|to)\s+/i, '')
        // Whatever the sentence started with, what is left should not open on a joining word.
        .replace(/^\s*(?:can|could|will|for|to|that|which)\s+/i, '')
        .trim()

    const text = stripped.length >= 10 ? stripped : said

    // Cut to a whole word rather than mid-syllable, and drop a trailing comma or full stop.
    let short = text.length <= 60 ? text : text.slice(0, 60).replace(/\s+\S*$/, '')
    short = short.replace(/[\s,.;:]+$/, '')
    // A phrase that ends on "and" or "with" reads as though it were cut off, because it was.
    short = short.replace(/\s+(?:and|or|but|with|for|to|the|an?|of|in|on)$/i, '')

    return short.charAt(0).toUpperCase() + short.slice(1)
}

/**
 * A fresh build from the wizard's answers.
 *
 * It starts with no files. Generation fills them in, and until it does the build has nothing
 * to preview — which is the honest state for an app whose code has not been written yet.
 */
export function buildFromWizard(answers: any) {
    const {
        name,
        prompt = '',
        category = 'education',
        tone = 'brand',
        fontScale = 'normal',
        highContrast = false,
        layout = 'cards',
    } = answers ?? {}

    return {
        _id: randomUUID(),
        name: String(name || 'My App').slice(0, 30),
        tagline: taglineFromPrompt(prompt),
        description: String(prompt),
        icon: String(answers?.icon ?? '') || 'fa-cube',
        tone,
        category,
        version: '0.1.0',
        status: 'draft',
        pricingModel: 'free',
        price: 0,
        config: {
            ...defaultBuildConfig,
            prompt,
            tone,
            fontScale,
            highContrast,
            layout,
        },
        files: [],
        generatedAt: '',
        versions: [{ version: '0.1.0', date: today(), note: 'Generated with AI' }],
        reviewComments: [],
        features: [],
        privacyPolicy: '',
        supportEmail: '',
        listingDone: false,
        pricingDone: false,
        packageMB: 0,
        installedMB: 0,
        testedAt: '',
        updatedAt: today(),
    }
}
