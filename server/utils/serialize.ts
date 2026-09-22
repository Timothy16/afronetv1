// server/utils/serialize.ts

// Strip the password (and __v) before sending a user to the client.
// Accepts either a mongoose doc or a .lean() plain object.
export function serializeAfronetUser(user: any) {
    if (!user) return null
    const obj = typeof user.toObject === 'function' ? user.toObject() : user
    const { password, __v, ...rest } = obj
    return { ...rest, _id: obj._id?.toString?.() ?? obj._id }
}
