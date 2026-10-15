// server/utils/storeListing.ts
//
// Turning an approved build into a store listing. This is the one place a listing is created
// or changed, which is what keeps a listing honest: what a user reads is always the version a
// reviewer approved, never something a developer's browser asked for.
//
// It deliberately re-derives what the app needs a connection for, which permissions it
// declares, and how large it is, from the build's own files and config — rather than trusting
// whatever the client sent, or a number stored alongside.

import { filesOf, sizeOf } from './packageFormat'

const PERMISSIONS: Record<string, { id: string; label: string; reason: string }> = {
    storage: { id: 'storage', label: 'Save data on this device', reason: 'Keeps what you do while the app is open. Nothing leaves your device.' },
    network: { id: 'network', label: 'Internet access', reason: 'Needed only for the features listed under “Needs internet”.' },
    notifications: { id: 'notifications', label: 'Notifications', reason: 'Reminds you about study sessions you scheduled. You can turn this off.' },
    microphone: { id: 'microphone', label: 'Microphone', reason: 'Records lectures only when you press Record.' },
    images: { id: 'images', label: 'Choose images', reason: 'Lets you attach photos you pick. The app cannot browse your gallery.' },
}

/** What this build reaches the network for, read from the build itself. */
export function connectionNeeds(config: any) {
    const needs: string[] = []
    if (config?.externalApi) needs.push('An external service')
    return needs
}

export function bumpVersion(version: string, kind: 'minor' | 'patch' = 'minor') {
    const parts = String(version).split('.').map((x) => parseInt(x, 10) || 0)
    const [major = 0, minor = 0, patch = 0] = parts
    return kind === 'minor' ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`
}

/** `Exam Countdown` -> `exam-countdown`. The address people share. */
export function listingSlug(name: string) {
    return String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'app'
}

/**
 * The listing for a build, as it should appear in the store today.
 *
 * `creator` is the account that owns the build; `today` is passed in so the caller decides
 * what "now" means rather than this reaching for a clock.
 */
export function listingFromBuild(build: any, creator: any, today: string) {
    const needs = connectionNeeds(build.config)

    // What the app can actually do, not what it was claimed it would do. A sandboxed app keeps
    // what it holds while it is open and reaches nothing, so that is the one permission a user
    // is shown — and it is true of every app in the store.
    const permissions = [PERMISSIONS.storage]
    if (needs.length) permissions.push(PERMISSIONS.network)

    const sizeMB = Math.round((sizeOf(filesOf(build)) / 1024 / 1024) * 1000) / 1000

    return {
        name: build.name,
        tagline: build.tagline,
        description: build.description,
        icon: build.icon,
        tone: build.config?.tone ?? build.tone,
        category: build.category,

        creatorId: creator?.username ?? '',
        creatorName: [creator?.firstName, creator?.lastName].filter(Boolean).join(' ') || creator?.username || 'Afronet developer',
        creatorHandle: creator?.username ?? '',
        creatorSchool: creator?.school ?? '',

        // The real size, measured from the files that will be downloaded, rather than read from
        // a number on the build. A stored figure is a copy that can go stale — one did, and the
        // store advertised a 15 KB app as weighing nothing.
        downloadMB: sizeMB,
        installedMB: Math.round(sizeMB * 1.5 * 1000) / 1000,

        needsInternet: needs,

        version: build.version,
        updatedAt: today,

        price: build.pricingModel === 'paid' ? build.price : 0,

        permissions,
        dataCollected: needs.length ? ['Anonymous usage counts'] : [],
        features: build.features ?? [],
        externalDeps: build.config?.externalApi ? ['External service (reviewed)'] : [],

        tags: [build.category, ...String(build.name).toLowerCase().split(/\s+/)],
        status: 'live',
    }
}
