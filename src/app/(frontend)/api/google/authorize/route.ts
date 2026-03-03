/**
 * Google OAuth2 Authorization Route
 * Redirects user to Google consent screen
 */

import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/utilities/google-oauth'

export async function GET() {
  try {
    const authUrl = getAuthUrl()
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Authorization error:', error)
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    )
  }
}
