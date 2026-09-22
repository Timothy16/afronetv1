// server/utils/identity.ts

// Validation lives here (API layer), not on the model, so rules can change
// without a schema migration.

export const USERNAME_PATTERN = /^[a-z0-9_.]{3,30}$/
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PHONE_PATTERN = /^\+?[0-9]{7,15}$/
export const PASSWORD_MIN_LENGTH = 8

// Profile images live under this folder; the path shape matches what /api/upload/init issues
export const PROFILE_IMAGE_FOLDER = 'afronet/avatars'
export const PROFILE_IMAGE_PATTERN = /^afronet\/avatars\/\d+-[a-f0-9]{16}\.(jpg|jpeg|png|webp|gif)$/

// "@Elijah " -> "elijah"
export function normalizeUsername(value: unknown) {
    return typeof value === 'string' ? value.trim().replace(/^@+/, '').toLowerCase() : ''
}

export function normalizeEmail(value: unknown) {
    return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

// "+234 803-123 4567" -> "+2348031234567"
export function normalizePhone(value: unknown) {
    return typeof value === 'string' ? value.trim().replace(/[\s()-]/g, '') : ''
}

export function cleanString(value: unknown) {
    return typeof value === 'string' ? value.trim() : ''
}

// Mongo duplicate-key error (unique index race between the pre-check and create)
export function isDuplicateKeyError(error: any) {
    return error?.code === 11000
}
