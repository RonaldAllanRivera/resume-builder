'use client'

import { useEffect } from 'react'

export function PayloadAdminRemover() {
  useEffect(() => {
    // Function to remove Payload admin bar completely
    const removePayloadAdminBar = () => {
      // Remove all Payload admin bar elements
      const selectors = [
        '[class*="admin-bar"]',
        '[class*="payload-admin-bar"]',
        '[class*="AdminBar"]',
        '[class*="payloadcms-admin-bar"]',
        '[data-payload-admin-bar]',
        '#payload-admin-bar',
        'header[class*="container"]',
        'header.z-20',
        'header[class*="z-"]',
        '.payload-admin-bar',
        '.payload-cms-admin-bar'
      ]

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        elements.forEach(element => {
          if (element && !element.closest('.rainbow-header')) {
            element.remove()
          }
        })
      })

      // Remove any script tags that might create admin bar
      const scripts = document.querySelectorAll('script')
      scripts.forEach(script => {
        if (script.textContent?.includes('payload-admin-bar') || 
            script.textContent?.includes('AdminBar') ||
            script.textContent?.includes('payloadcms')) {
          script.remove()
        }
      })

      // Remove any style tags related to admin bar
      const styles = document.querySelectorAll('style')
      styles.forEach(style => {
        if (style.textContent?.includes('admin-bar') ||
            style.textContent?.includes('AdminBar')) {
          style.remove()
        }
      })
    }

    // Remove immediately
    removePayloadAdminBar()

    // Remove periodically (in case Payload injects it later)
    const interval = setInterval(removePayloadAdminBar, 100)

    // Also remove on DOM changes
    const observer = new MutationObserver(() => {
      removePayloadAdminBar()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id']
    })

    // Cleanup
    return () => {
      clearInterval(interval)
      observer.disconnect()
    }
  }, [])

  return null
}
