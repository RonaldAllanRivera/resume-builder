/**
 * Google OAuth2 Logout Route
 * Clear stored tokens
 */

import { NextResponse } from 'next/server'
import { clearTokens } from '@/utilities/google-oauth'

export async function POST() {
  try {
    clearTokens()
    return NextResponse.json({
      success: true,
      message: 'Google authentication tokens cleared',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to clear tokens' },
      { status: 500 }
    )
  }
}
