// server/utils/validateApp.ts
//
// What an app has to be before anyone can download it.
//
// This is the one gate between a model writing code and that code running on a student's
// phone. The developer guide is firm that generated output is never published directly, and
// this is the thing that makes that sentence true rather than a statement of intent.
//
// It checks the files, not the developer's claims about them. Two kinds of finding:
//
//   A failure stops publishing. These are the sandbox contract — an app that reaches the
//   network, pulls in code from elsewhere, or does not run at all.
//
//   A warning is reported and published anyway. A reviewer would want to know; a machine
//   should not refuse over it.
//
// Everything here reads the text of the files. That is enough: the sandbox already blocks
// these at runtime, so the purpose of checking is to tell a developer *why* their app will
// misbehave rather than letting them ship something that silently does nothing.

export interface Finding {
    /** What is wrong, in words a developer can act on. */
    message: string
    /** Which file it is in. */
    file: string
    fatal: boolean
}

export interface Validation {
    ok: boolean
    findings: Finding[]
}

/** The largest an app may be. Generous for one HTML file; a guard against a runaway. */
const MAX_BYTES = 2 * 1024 * 1024

const REQUIRED_CSP = "default-src 'none'"

/**
 * Things an app cannot do inside the sandbox, with the reason it would fail.
 *
 * Written against what the code says rather than what it does, which means a string that
 * merely mentions one of these words is a false positive. Each pattern therefore looks for
 * the call or the attribute, not the bare word.
 */
const FORBIDDEN: { re: RegExp; message: string; fatal: boolean }[] = [
    {
        re: /\bfetch\s*\(/,
        message: 'Calls fetch(). The sandbox blocks all network access, so this would fail at runtime.',
        fatal: true,
    },
    {
        re: /\bnew\s+XMLHttpRequest\b|\bXMLHttpRequest\s*\(/,
        message: 'Uses XMLHttpRequest. The sandbox blocks all network access.',
        fatal: true,
    },
    {
        re: /\bnew\s+WebSocket\b/,
        message: 'Opens a WebSocket. The sandbox blocks all network access.',
        fatal: true,
    },
    {
        re: /\bnew\s+EventSource\b/,
        message: 'Opens an EventSource. The sandbox blocks all network access.',
        fatal: true,
    },
    {
        re: /navigator\.sendBeacon\s*\(/,
        message: 'Calls navigator.sendBeacon(). The sandbox blocks all network access.',
        fatal: true,
    },
    {
        re: /\b(?:src|href)\s*=\s*["'](?:https?:)?\/\//i,
        message: 'Loads a file from another site. Everything an app needs must be inside it.',
        fatal: true,
    },
    {
        re: /@import\s+(?:url\()?["']?(?:https?:)?\/\//i,
        message: 'Imports a stylesheet from another site. Everything an app needs must be inside it.',
        fatal: true,
    },
    {
        re: /\bimport\s*\(/,
        message: 'Imports a module at runtime. An app is one self-contained file.',
        fatal: true,
    },
    {
        re: /\b(?:local|session)Storage\b/,
        message: 'Uses browser storage, which is unavailable in the sandbox and throws when touched.',
        fatal: true,
    },
    {
        re: /\bindexedDB\b/i,
        message: 'Uses IndexedDB, which is unavailable in the sandbox and throws when touched.',
        fatal: true,
    },
    {
        re: /document\.cookie\b/,
        message: 'Reads or writes cookies, which an app on an opaque origin cannot do.',
        fatal: true,
    },
    {
        re: /\bwindow\.(?:top|parent)\b(?!\s*===)/,
        message: 'Reaches for the page outside the sandbox. The browser refuses this.',
        fatal: false,
    },
    {
        re: /\b(?:eval)\s*\(/,
        message: 'Calls eval(). It is not needed, and it is the hardest thing to review.',
        fatal: false,
    },
]

/** The contents of every <script> in the document, so they can be parsed. */
function scriptsIn(html: string) {
    const out: string[] = []
    const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null) {
        if (m[1].trim()) out.push(m[1])
    }
    return out
}

/**
 * Checks one app.
 *
 * `files` is `{ name: content }` — the same shape the package carries, so what is validated is
 * exactly what gets downloaded.
 */
export function validateApp(
    files: Record<string, string>,
    entryPoint = 'index.html',
    opts: { savesProgress?: boolean } = {},
): Validation {
    const findings: Finding[] = []
    const fail = (message: string, file: string) => findings.push({ message, file, fatal: true })
    const warn = (message: string, file: string) => findings.push({ message, file, fatal: false })

    const names = Object.keys(files)
    if (!names.length) {
        fail('There are no files. Nothing has been generated for this app.', '—')
        return { ok: false, findings }
    }

    if (!files[entryPoint]) {
        fail(`The entry point ${entryPoint} is missing, so there is nothing to open.`, entryPoint)
        return { ok: false, findings }
    }

    const totalBytes = Object.values(files).reduce((n, body) => n + Buffer.byteLength(body, 'utf8'), 0)
    if (totalBytes > MAX_BYTES) {
        fail(`The app is ${(totalBytes / 1024 / 1024).toFixed(1)} MB, over the ${MAX_BYTES / 1024 / 1024} MB limit.`, entryPoint)
    }

    const entry = files[entryPoint]

    if (!/<html[\s>]/i.test(entry)) {
        fail('The entry point is not an HTML document.', entryPoint)
    }

    // Without this the sandbox would still block the app, but silently — the policy is what
    // turns "it does nothing" into "it was not allowed to".
    if (!entry.includes(REQUIRED_CSP)) {
        fail('The content security policy is missing from the document, so it cannot be trusted to stay inside the sandbox.', entryPoint)
    }

    for (const name of names) {
        const body = files[name]
        for (const rule of FORBIDDEN) {
            if (rule.re.test(body)) {
                // The policy itself names the things it forbids, so the meta tag is not a finding.
                const line = body.split('\n').find((l) => rule.re.test(l)) ?? ''
                if (line.includes('http-equiv="Content-Security-Policy"')) continue
                findings.push({ message: rule.message, file: name, fatal: rule.fatal })
            }
        }

        if (name.endsWith('.html')) {
            for (const script of scriptsIn(body)) {
                try {
                    // Compiles the body without running a line of it.
                    new Function(script)
                } catch (e: any) {
                    fail(`A script does not parse: ${e?.message ?? 'syntax error'}`, name)
                }
            }
        }
    }

    if (!scriptsIn(entry).length) {
        warn('The app has no code in it, so nothing on screen will respond.', entryPoint)
    }

    // The listing tells users this app saves what they do, and the only way it can is through
    // the bridge. An app that never calls it keeps nothing, however the code reads — which is
    // the gap this check exists to catch, because it is invisible until someone comes back.
    if (opts.savesProgress && !/afronet\.storage\.set\s*\(/.test(entry)) {
        warn(
            'This app says it saves what people do, but it never calls afronet.storage.set, so nothing will be there when they come back.',
            entryPoint,
        )
    }

    // The bridge is Afronet's, injected into every app. An app that defines its own is either
    // confused or trying to stand in front of it.
    const sdkCopies = (entry.match(/window\.afronet\s*=/g) ?? []).length
    if (sdkCopies > 1) {
        fail('The app defines its own Afronet bridge, which would replace the real one.', entryPoint)
    }

    return { ok: !findings.some((f) => f.fatal), findings }
}
