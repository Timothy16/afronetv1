// server/utils/clock.ts
//
// What day it is, in one place.
//
// Every endpoint that stamped a record carried its own `const TODAY = '2026-10-12'`, which was
// right on the day it was written and wrong every day since: apps published this week were
// dated to last week, and an app shipped twice in a row looked as though nothing had moved.
//
// UTC, not the server's local timezone, so a record stamped in Lagos and one stamped on a
// host in another region sort together and mean the same thing.

/** `2026-10-14` — the form every stored date uses. */
export function today() {
    return new Date().toISOString().slice(0, 10)
}

/** A full timestamp, for the few places that need more than a day. */
export function nowIso() {
    return new Date().toISOString()
}
