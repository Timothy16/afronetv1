// server/models/AfronetUser.model.ts
import mongoose from 'mongoose'

const AfronetUserSchema = new mongoose.Schema({
    // --- Identity ---
    firstName: { type: String, default: null, trim: true },
    lastName: { type: String, default: null, trim: true },

    // African ID handle — becomes the address for calls, mail and payments.
    // No default: the sparse unique index only skips documents without the field, so a stored
    // null would make every account after the first one collide. Registration does not collect
    // a handle yet, so the field simply stays absent until it does.
    username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
    },

    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
    },
    phone: { type: String, default: null, trim: true },

    institution: { type: String, default: null, trim: true },
    country: { type: String, default: null, trim: true }, // free-text country name
    city: { type: String, default: null, trim: true },

    // GCS object path (e.g. afronet/avatars/…); the client builds the URL with useGoogleCloud().getImageUrl
    profileImage: { type: String, default: null },

    password: { type: String, default: null }, // hashed in the API layer (bcrypt)

    // --- African ID (DCI) ---
    africanId: { type: String, default: null, trim: true },
    isDciVerified: { type: Boolean, default: false }, // unverified users are held on /verify-id

    isActive: { type: Boolean, default: true }, // soft delete / restore
    isAdmin: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null },

}, { timestamps: true })

export const AfronetUser =
    mongoose.models.AfronetUser ||
    mongoose.model('AfronetUser', AfronetUserSchema)