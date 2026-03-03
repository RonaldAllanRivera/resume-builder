/**
 * Google OAuth2 Callback Route
 * Handles the redirect from Google after user authorization
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokensFromCode, saveTokens } from '@/utilities/google-oauth'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin?google_auth_error=${error}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.json(
      { error: 'No authorization code received' },
      { status: 400 }
    )
  }

  try {
    const tokens = await getTokensFromCode(code)
    saveTokens(tokens)

    return NextResponse.redirect(
      new URL('/admin?google_auth_success=true', request.url)
    )
  } catch (error) {
    console.error('Token exchange error:', error)
    return NextResponse.redirect(
      new URL('/admin?google_auth_error=token_exchange_failed', request.url)
    )
  }
}
