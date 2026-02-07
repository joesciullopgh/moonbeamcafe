import { createClient } from '@/lib/supabase/client'

const BUCKET = 'menu-images'

export async function uploadMenuImage(file: File, itemId?: string): Promise<string | null> {
  const supabase = createClient()

  // Create a unique filename
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const name = itemId || crypto.randomUUID()
  const path = `${name}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Upload error:', error.message)
    return null
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path)

  return urlData.publicUrl
}

export async function deleteMenuImage(imageUrl: string): Promise<boolean> {
  const supabase = createClient()

  // Extract the path from the full URL
  const parts = imageUrl.split(`/storage/v1/object/public/${BUCKET}/`)
  if (parts.length < 2) return false
  const path = parts[1]

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path])

  if (error) {
    console.error('Delete error:', error.message)
    return false
  }

  return true
}
