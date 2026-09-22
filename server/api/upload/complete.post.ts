// server/api/upload/complete.post.ts
import { Storage } from '@google-cloud/storage'

let _storage: Storage | null = null

function getStorage() {
    if (_storage) return _storage
    const config = useRuntimeConfig()
    _storage = new Storage({
        projectId: config.googleCloud.projectId,
        credentials: {
            client_email: config.googleCloud.clientEmail,
            private_key: config.googleCloud.privateKey?.replace(/\\n/g, '\n'),
        },
    })
    return _storage
}

function resolveBucket(gcsPath: string, fallback: string): string {
    if (gcsPath.startsWith('dciwiki')) return 'dci-wikis'
    if (gcsPath.startsWith('myschoolacademy')) return 'myschoolacademystore'
    return fallback
}

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const { gcsPath } = await readBody(event)

    if (!gcsPath) {
        throw createError({ statusCode: 400, message: 'gcsPath is required' })
    }

    const bucketName = resolveBucket(gcsPath, config.googleCloud.storageBucket)

    const storage = getStorage()
    await storage.bucket(bucketName).file(gcsPath).makePublic()

    console.log('✅ Upload complete and public:', bucketName, gcsPath)

    return {
        success: true,
        gcsPath,
        publicUrl: `https://storage.googleapis.com/${bucketName}/${gcsPath}`,
    }
})