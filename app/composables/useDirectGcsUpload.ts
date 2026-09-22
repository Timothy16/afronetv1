// composables/useDirectGcsUpload.ts
export const useDirectGcsUpload = () => {
  const uploading = ref(false)
  const progress = ref(0)
  const error = ref<string | null>(null)

  const upload = async (file: File, folder: string, onProgress?: (pct: number) => void): Promise<string> => {
    uploading.value = true
    progress.value = 0
    error.value = null
    try {
      const { sessionUri, gcsPath } = await $fetch<{ sessionUri: string; gcsPath: string }>('/api/upload/init', {
        method: 'POST',
        body: { filename: file.name, filetype: file.type, folder },
      })

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', sessionUri)
        xhr.setRequestHeader('Content-Range', `bytes 0-${file.size - 1}/${file.size}`)
        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return
          const pct = Math.round((e.loaded / e.total) * 100)
          progress.value = pct
          onProgress?.(pct)
        }
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) resolve()
          else reject(new Error(`GCS upload failed: HTTP ${xhr.status}`))
        }
        xhr.onerror = () => reject(new Error('GCS upload network error'))
        xhr.send(file)
      })

      await $fetch('/api/upload/complete', { method: 'POST', body: { gcsPath } })
      progress.value = 100
      onProgress?.(100)
      return gcsPath
    } catch (err: any) {
      error.value = err?.message || 'Upload failed'
      throw err
    } finally {
      uploading.value = false
    }
  }

  return { upload, uploading, progress, error }
}
