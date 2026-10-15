// server/models/AfronetDevApp.model.ts
import mongoose from 'mongoose'

/**
 * A build in Afronet Studio: someone's app from first draft to published, and after.
 *
 * This is the source of truth for the *work*. Its public face, once approved, is an
 * AfronetApp — and `storeAppId` is the link between them. Nothing else writes a listing.
 *
 * Two fields carry the rules from the developer guide:
 *
 *   `testedAt` is cleared by every change to the build, because an app that was tested and
 *   then edited is an untested app, and only a tested build can be submitted.
 *
 *   `status` is the gate. A draft cannot be submitted, only a reviewer moves an app out of
 *   in_review, and publishing is what creates the listing.
 */
const BuildConfigSchema = new mongoose.Schema({
    prompt: { type: String, default: '' },
    fontScale: { type: String, default: 'normal' },
    saveProgress: { type: Boolean, default: true },
    tone: { type: String, default: 'brand' },
    layout: { type: String, default: 'cards' },
    highContrast: { type: Boolean, default: false },
    externalApi: { type: Boolean, default: false },
}, { _id: false })

const AppFileSchema = new mongoose.Schema({
    /** Its path inside the package — `index.html`. What the manifest's entry point names. */
    name: { type: String, required: true },
    content: { type: String, default: '' },
}, { _id: false })

const VersionSchema = new mongoose.Schema({
    version: { type: String, required: true },
    date: { type: String, required: true },
    note: { type: String, default: '' },
}, { _id: false })

const ReviewCommentSchema = new mongoose.Schema({
    id: { type: String, required: true },
    area: { type: String, default: '' },
    body: { type: String, default: '' },
    date: { type: String, default: '' },
    resolved: { type: Boolean, default: false },
}, { _id: false })

const AfronetDevAppSchema = new mongoose.Schema({
    /** A uuid, so a build keeps its identity from the moment it is created. */
    _id: { type: String, required: true },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'AfronetUser', required: true, index: true },

    /** The listing this build publishes to, once it has been approved. */
    storeAppId: { type: String, default: '' },

    name: { type: String, required: true, trim: true },
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },
    icon: { type: String, default: 'fa-list-check' },
    tone: { type: String, default: 'brand' },
    category: { type: String, default: 'education' },

    version: { type: String, default: '0.1.0' },

    /**
     * draft · generating · building · testing · review_required · in_review · published ·
     * rejected · suspended · archived
     */
    status: { type: String, default: 'draft', index: true },

    /** free | paid. Nothing else: in-app purchases have no payment flow. */
    pricingModel: { type: String, default: 'free' },
    price: { type: Number, default: 0 },

    config: { type: BuildConfigSchema, default: () => ({}) },

    /**
     * The app's own files, as generated.
     *
     * Kept rather than re-rendered. Generation costs money and takes twenty seconds, and two
     * runs of it produce two different apps: re-generating on every preview and every download
     * would bill for each one and break the checksum that makes "damaged package" meaningful.
     * So an app is written once, stored here, and served from here every time after.
     *
     * A list of named files rather than a map keyed by name, because every file name has a dot
     * in it and Mongoose maps forbid dots in keys — `index.html` cannot be a key. Names are
     * data either way; here they are values, where nothing restricts them.
     */
    files: { type: [AppFileSchema], default: [] },

    /** When the files were last written. Empty means nothing has been generated yet. */
    generatedAt: { type: String, default: '' },

    versions: { type: [VersionSchema], default: [] },
    reviewComments: { type: [ReviewCommentSchema], default: [] },

    features: { type: [String], default: [] },
    privacyPolicy: { type: String, default: '' },
    supportEmail: { type: String, default: '' },

    listingDone: { type: Boolean, default: false },
    pricingDone: { type: Boolean, default: false },

    packageMB: { type: Number, default: 0 },
    installedMB: { type: Number, default: 0 },

    /** Empty whenever the build has changed since the last test run. */
    testedAt: { type: String, default: '' },

    // Mirrored from the listing so the developer's own list needs one query, not two.

    /** Shown, never compared across time zones. */
    updatedAt: { type: String, required: true },
}, { timestamps: false, versionKey: false })

// "My apps, most recently worked on first" is the only list this model serves.
AfronetDevAppSchema.index({ userId: 1, updatedAt: -1 })

export const AfronetDevApp =
    mongoose.models.AfronetDevApp ||
    mongoose.model('AfronetDevApp', AfronetDevAppSchema)
