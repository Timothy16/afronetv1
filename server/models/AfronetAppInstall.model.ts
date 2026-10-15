// server/models/AfronetAppInstall.model.ts
//
// What an account has installed. Two jobs, and they were being confused for each other.
//
// It is the library: the apps this person has, whatever device they are on. That used to live
// only in the browser, reconciled against the files in Cache Storage — so clearing a cache
// emptied someone's library and the store offered to install apps they already had. The files
// being gone means they need fetching again; it does not mean the app was never theirs.
//
// And it is what makes the install count mean accounts rather than button presses. A row is
// written the first time and never again, so reinstalling adds nothing. Removing an app
// deletes the row, because My Apps is a list of what someone has — but the count on the
// listing does not go down, since that is all-time downloads, which is what the label says.

import mongoose from 'mongoose'

const AfronetAppInstallSchema = new mongoose.Schema({
    /** `<userId>:<appId>` — one row can exist per pair, enforced by the key itself. */
    _id: { type: String, required: true },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'AfronetUser', required: true, index: true },
    appId: { type: String, required: true, index: true },
    version: { type: String, default: '' },

    /** The measured size of the files, so the library can be shown before anything is fetched. */
    appFilesMB: { type: Number, default: 0 },
    installedAt: { type: String, default: '' },
}, {
    versionKey: false,
    timestamps: true,
})

export const AfronetAppInstall =
    mongoose.models.AfronetAppInstall ||
    mongoose.model('AfronetAppInstall', AfronetAppInstallSchema)
