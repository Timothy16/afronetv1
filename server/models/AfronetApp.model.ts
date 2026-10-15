// server/models/AfronetApp.model.ts
import mongoose from 'mongoose'

/**
 * A published app in the Afronet App Store — the listing a user reads before deciding whether
 * to spend data on it.
 *
 * The id is the listing's address (`quiz-master`), not an ObjectId, because it appears in the
 * URL a person shares and it has to stay readable and stable across republishes.
 *
 * A listing is written only by publishing a build from Studio, so everything here is the
 * approved version of what a developer submitted. The source of truth for the *build* is
 * AfronetDevApp; this is its public face.
 *
 * `needsInternet` is carried but not shown anywhere yet: this release needs a connection, and
 * an untested offline claim is exactly what the developer guide warns against. The `offline`
 * and `worksOffline` labels were here for the same reason and went, because a default of
 * "works offline" on every app is the claim itself.
 */
const PermissionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    label: { type: String, required: true },
    reason: { type: String, required: true },
}, { _id: false })

const ChangelogSchema = new mongoose.Schema({
    version: { type: String, required: true },
    date: { type: String, required: true },
    notes: { type: String, default: '' },
    mandatory: { type: Boolean, default: false },
}, { _id: false })

const AfronetAppSchema = new mongoose.Schema({
    /** The listing's address, e.g. 'quiz-master'. */
    _id: { type: String, required: true },

    name: { type: String, required: true, trim: true },
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },

    /** A Font Awesome 6 solid class, and a palette token — never a colour of its own. */
    icon: { type: String, default: 'fa-cube' },
    tone: { type: String, default: 'ink' },

    category: { type: String, required: true, index: true },

    creatorId: { type: String, default: '' },
    creatorName: { type: String, default: '' },
    creatorHandle: { type: String, default: '' },
    creatorSchool: { type: String, default: '' },

    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    // Carried for the offline release. Nothing reads this today.
    needsInternet: { type: [String], default: [] },

    downloadMB: { type: Number, default: 0 },
    installedMB: { type: Number, default: 0 },
    /** Free text about data an app uses beyond its package, e.g. "about 30 MB per hour". */
    extraData: { type: String, default: '' },

    version: { type: String, default: '1.0.0' },
    /** Dates are held as YYYY-MM-DD strings: they are shown, never compared across zones. */
    updatedAt: { type: String, required: true },
    releasedAt: { type: String, default: '' },

    /** Whole naira. 0 means free. */
    price: { type: Number, default: 0 },

    permissions: { type: [PermissionSchema], default: [] },
    dataCollected: { type: [String], default: [] },
    features: { type: [String], default: [] },
    externalDeps: { type: [String], default: [] },
    changelog: { type: [ChangelogSchema], default: [] },

    /** Which shelves this appears on: featured, trending, recommended, new, student… */
    collections: { type: [String], default: [], index: true },
    tags: { type: [String], default: [] },

    installs: { type: Number, default: 0 },

    /** live | suspended — a suspended listing cannot be downloaded, but existing users keep it. */
    status: { type: String, default: 'live', index: true },
}, { timestamps: false, versionKey: false })

// The store's shelves are "live apps, newest first" over and over.
AfronetAppSchema.index({ status: 1, updatedAt: -1 })

export const AfronetApp =
    mongoose.models.AfronetApp ||
    mongoose.model('AfronetApp', AfronetAppSchema)
