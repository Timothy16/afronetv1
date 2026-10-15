// server/utils/packageFormat.ts
//
// What a downloadable Afronet app *is*.
//
// A package is a manifest and a set of files. Nothing else. The manifest is what the store,
// the installer and the runtime all read — size before download, permissions before install,
// entry point and runtime version before running — so it is the one thing that has to stay
// stable while everything around it changes.
//
// The files are written by the model, once, and kept on the build. This file never generates
// anything: it reads what was stored and describes it. That separation is what the format was
// pinned first for — generation changed underneath it and nothing here moved.
//
// The checksum is over the files, in a fixed order, and it is what makes "damaged package" a
// real state rather than a simulated one: the device recomputes it and refuses a mismatch.

import { createHash } from 'node:crypto'

/** Bumped when the shape of a manifest changes in a way old runtimes cannot read. */
export const MANIFEST_VERSION = 1

/** Bumped when the bridge changes. A package declares the runtime it was built against. */
export const RUNTIME_VERSION = 1

/**
 * A build's files as `{ name: content }`, which is what the package, the checksum and the
 * runtime all work in.
 *
 * Stored as a list of `{ name, content }` — see the model for why — so this is where the two
 * shapes meet. One place converts, and the checksum stays order-independent because it sorts.
 */
export function filesOf(app: any): Record<string, string> {
    const files = app?.files
    if (!files) return {}
    if (!Array.isArray(files)) return { ...files }

    const out: Record<string, string> = {}
    for (const f of files) {
        if (f?.name) out[f.name] = f.content ?? ''
    }
    return out
}

/** The other direction: what gets written to a build. */
export function filesToDoc(files: Record<string, string>) {
    return Object.keys(files).sort().map((name) => ({ name, content: files[name] }))
}

export interface AfronetPackage {
    manifest: {
        manifestVersion: number
        appId: string
        name: string
        version: string
        runtime: number
        entryPoint: string
        permissions: string[]
        /** What the app may ask the host for. The host enforces this, not the app. */
        bridgeCalls: string[]
        sizeBytes: number
        checksum: string
        builtAt: string
    }
    files: Record<string, string>
}

/** sha-256 over every file, in name order, so the same package always hashes the same. */
export function checksumOf(files: Record<string, string>) {
    const hash = createHash('sha256')
    for (const name of Object.keys(files).sort()) {
        hash.update(name)
        hash.update('\0')
        hash.update(files[name])
        hash.update('\0')
    }
    return `sha256-${hash.digest('hex')}`
}

export function sizeOf(files: Record<string, string>) {
    return Object.values(files).reduce((total, body) => total + Buffer.byteLength(body, 'utf8'), 0)
}

/**
 * Which bridge calls this build is allowed to make, derived from its config rather than from
 * anything it asks for. An app that never declared the network cannot be granted net.fetch,
 * whatever its code tries.
 */
function bridgeCallsFor(config: any) {
    const calls = ['ui.toast']
    if (config?.saveProgress !== false) calls.push('storage.get', 'storage.set')
    if (config?.externalApi) calls.push('net.fetch')
    return calls
}

function permissionsFor(config: any) {
    const permissions: string[] = []
    if (config?.saveProgress !== false) permissions.push('storage')
    if (config?.externalApi) permissions.push('network')
    return permissions
}

/**
 * Builds the package for an app.
 *
 * `appId` is the address the app is known by — a listing's id when it has been published, or
 * the build's id while it is still being previewed. It is what namespaces the app's storage,
 * so it has to be stable for the same app and different between two apps.
 */
export function buildPackage(app: any, appId: string, builtAt: string): AfronetPackage {
    const config = app.config ?? {}
    const files = filesOf(app)

    if (!Object.keys(files).length) {
        throw createError({ statusCode: 409, message: 'This app has not been generated yet' })
    }

    return {
        manifest: {
            manifestVersion: MANIFEST_VERSION,
            appId,
            name: app.name,
            version: app.version,
            runtime: RUNTIME_VERSION,
            entryPoint: 'index.html',
            permissions: permissionsFor(config),
            bridgeCalls: bridgeCallsFor(config),
            sizeBytes: sizeOf(files),
            checksum: checksumOf(files),
            builtAt,
        },
        files,
    }
}
