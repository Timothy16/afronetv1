import { Storage } from '@google-cloud/storage'
import crypto from 'node:crypto'

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

function resolveBucket(folder: string, fallback: string): string {
    if (folder.startsWith('dciwiki')) return 'dci-wikis'
    if (folder.startsWith('myschoolacademy')) return 'myschoolacademystore'
    return fallback
}

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const { filename, filetype, folder = 'uploads' } = await readBody(event)

    if (!filename || !filetype) {
        throw createError({ statusCode: 400, message: 'filename and filetype are required' })
    }

    const ext = filename.split('.').pop()?.toLowerCase() || 'mp4'
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`
    const gcsPath = `${folder}/${uniqueName}.${ext}`

    const bucketName = resolveBucket(folder, config.googleCloud.storageBucket)

    const storage = getStorage()
    const file = storage.bucket(bucketName).file(gcsPath)

    const origin = getRequestHeader(event, 'origin') || 'http://localhost:3000'

    const [sessionUri] = await file.createResumableUpload({
        origin,
        metadata: { contentType: filetype },
    })

    console.log('✅ GCS session created:', bucketName, gcsPath)

    return { sessionUri, gcsPath }
})