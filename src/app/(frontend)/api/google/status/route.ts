/**
 * Google OAuth2 Status Route
 * Check if user is authenticated with Google
 */

import { NextResponse } from 'next/server'
import { isAuthenticated, loadTokens } from '@/utilities/google-oauth'

export async function GET() {
  try {
    const authenticated = isAuthenticated()
    const tokens = loadTokens()

    if (!authenticated || !tokens) {
      return NextResponse.json({
        authenticated: false,
        message: 'Not authenticated. Visit /api/google/authorize to grant access.',
      })
    }

    // Check if token is expired
    const now = Date.now()
    const isExpired = tokens.expiry_date ? tokens.expiry_date < now : false

    return NextResponse.json({
      authenticated: true,
      tokenExpired: isExpired,
      scopes: tokens.scope,
      message: isExpired
        ? 'Token expired but will auto-refresh on next use'
        : 'Authenticated and ready',
    })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check authentication status' },
      { status: 500 }
    )
  }
}
