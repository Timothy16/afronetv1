// server/utils/serialize.ts

// Strip the password (and __v) before sending a user to the client.
// Accepts either a mongoose doc or a .lean() plain object.
export function serializeAfronetUser(user: any) {
    if (!user) return null
    const obj = typeof user.toObject === 'function' ? user.toObject() : user
    const { password, __v, ...rest } = obj
    return { ...rest, _id: obj._id?.toString?.() ?? obj._id }
}

// A store listing, as the app screens expect it: `id` rather than `_id`, and nothing else
// changed. Mongo's _id is the listing's address, so it is renamed rather than dropped.
export function serializeAfronetApp(app: any) {
    if (!app) return null
    const obj = typeof app.toObject === 'function' ? app.toObject() : app
    const { _id, __v, ...rest } = obj
    return { id: _id, ...rest }
}

// A Studio build, as the Studio screens expect it: `id` rather than `_id`, and without the
// owner's user id, which the client never needs and should not carry around.
export function serializeAfronetDevApp(app: any) {
    if (!app) return null
    const obj = typeof app.toObject === 'function' ? app.toObject() : app
    const { _id, userId, __v, files, ...rest } = obj

    // The files stay on the server. Studio lists every build an account has, and sending each
    // one's whole source would make that list tens of times larger to tell the screens
    // something they only need a yes or no for. The preview fetches the package instead.
    const names = Array.isArray(files) ? files.map((f: any) => f?.name).filter(Boolean) : Object.keys(files ?? {})

    return { id: _id, ...rest, fileNames: names, hasFiles: names.length > 0 }
}
