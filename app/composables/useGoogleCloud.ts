// composables/useGoogleCloud.ts
export const useGoogleCloud = () => {
  const config = useRuntimeConfig()

  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return '/favicon-16x16.png'

    // Check if path is already a full URL (old Azure data)
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path // Return as-is for old data
    }

    // For new relative paths, construct the full URL
    const bucketName = 'myschoolacademystore'
    return `https://storage.googleapis.com/${bucketName}/${path}`
  }

  return { getImageUrl }
}
