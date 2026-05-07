import { getPayload } from 'payload'
import config from '@payload-config'
import { getTemplate as getTemplateFromRegistry } from '@/templates/registry'
import type { TemplateComponents } from '@/templates/registry'

/**
 * Get the active template based on site settings
 * Supports preview override via query param
 */
export async function getTemplate(previewTemplate?: string): Promise<TemplateComponents> {
  // If preview template is provided and valid, use it
  if (previewTemplate) {
    const validTemplates = ['rainbow']
    if (validTemplates.includes(previewTemplate)) {
      return getTemplateFromRegistry(previewTemplate)
    }
  }

  // Otherwise, fetch from site settings
  try {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({
      slug: 'siteSettings',
      depth: 0,
    })

    const templateKey = settings?.publicTemplate || 'rainbow'
    return getTemplateFromRegistry(templateKey)
  } catch (error) {
    console.error('Error fetching template from settings:', error)
    return getTemplateFromRegistry('rainbow')
  }
}

/**
 * Get site settings including navigation visibility
 */
export async function getSiteSettings() {
  try {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({
      slug: 'siteSettings',
      depth: 0,
    })
    return settings
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return null
  }
}
