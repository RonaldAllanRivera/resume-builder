/**
 * Google OAuth2 utilities for user-based authentication
 * This approach uses the user's Google account and Drive quota
 * Works in local Docker without domain-wide delegation
 */

import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'

const TOKEN_PATH = path.join(process.cwd(), '.google-token.json')

export interface GoogleTokens {
  access_token: string
  refresh_token?: string
  scope: string
  token_type: string
  expiry_date: number
}

/**
 * Get OAuth2 client configured with credentials
 */
export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId) {
    throw new Error('Missing GOOGLE_CLIENT_ID environment variable')
  }
  if (!clientSecret) {
    throw new Error('Missing GOOGLE_CLIENT_SECRET environment variable')
  }
  if (!redirectUri) {
    throw new Error('Missing GOOGLE_REDIRECT_URI environment variable')
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

/**
 * Generate authorization URL for user to grant access
 */
export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client()

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/documents',
    ],
    prompt: 'consent', // Force consent screen to get refresh token
  })

  return authUrl
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string): Promise<GoogleTokens> {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.access_token) {
    throw new Error('No access token received from Google')
  }

  return tokens as GoogleTokens
}

/**
 * Save tokens to file
 */
export function saveTokens(tokens: GoogleTokens): void {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2))
}

/**
 * Load tokens from file
 */
export function loadTokens(): GoogleTokens | null {
  try {
    if (!fs.existsSync(TOKEN_PATH)) {
      return null
    }
    const content = fs.readFileSync(TOKEN_PATH, 'utf-8')
    return JSON.parse(content) as GoogleTokens
  } catch (error) {
    console.error('Error loading tokens:', error)
    return null
  }
}

/**
 * Get authenticated OAuth2 client with tokens
 * Automatically refreshes tokens if expired
 */
export async function getAuthenticatedClient() {
  const oauth2Client = getOAuth2Client()
  const tokens = loadTokens()

  if (!tokens) {
    throw new Error(
      'No tokens found. Please visit /api/google/authorize to authenticate with Google.',
    )
  }

  oauth2Client.setCredentials(tokens)

  // Check if token is expired and refresh if needed
  const now = Date.now()
  if (tokens.expiry_date && tokens.expiry_date < now) {
    console.log('[Google OAuth] Token expired, refreshing...')
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      saveTokens(credentials as GoogleTokens)
      oauth2Client.setCredentials(credentials)
      console.log('[Google OAuth] Token refreshed successfully')
    } catch (error) {
      console.error('[Google OAuth] Failed to refresh token:', error)
      throw new Error(
        'Failed to refresh access token. Please re-authorize at /api/google/authorize',
      )
    }
  }

  return oauth2Client
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const tokens = loadTokens()
  return tokens !== null && !!tokens.access_token
}

/**
 * Clear stored tokens (logout)
 */
export function clearTokens(): void {
  if (fs.existsSync(TOKEN_PATH)) {
    fs.unlinkSync(TOKEN_PATH)
  }
}
