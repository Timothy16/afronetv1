// server/utils/db.ts
import mongoose from 'mongoose'

export async function ensureMongo() {
    if (mongoose.connection.readyState === 1) return
    const config = useRuntimeConfig()
    await mongoose.connect(config.mongodbUri)
}
