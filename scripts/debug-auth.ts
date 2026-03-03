/**
 * Debug Google authentication
 */

import { google } from 'googleapis'

const run = async () => {
  console.log('\n🔍 Debugging Google Authentication...\n')

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
  if (!raw) {
    console.error('❌ GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 not found')
    process.exit(1)
  }

  let credentials
  try {
    credentials = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'))
    console.log('✓ Credentials decoded successfully')
    console.log('  Email:', credentials.client_email)
    console.log('  Project:', credentials.project_id)
    console.log('  Key ID:', credentials.private_key_id)
  } catch (error) {
    console.error('❌ Failed to decode credentials:', error)
    process.exit(1)
  }

  console.log('\n📡 Testing authentication...')

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  try {
    const client = await auth.getClient()
    console.log('✓ Auth client created')

    const accessToken = await client.getAccessToken()
    if (accessToken.token) {
      console.log('✓ Access token obtained')
      console.log('  Token starts with:', accessToken.token.substring(0, 20) + '...')
    } else {
      console.error('❌ No access token received')
      process.exit(1)
    }

    console.log('\n📁 Testing Drive API with timeout...')
    const drive = google.drive({ version: 'v3', auth })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await drive.files.get({
        fileId: process.env.GOOGLE_DRIVE_FOLDER_ID!,
        fields: 'id,name',
        supportsAllDrives: true,
      })
      clearTimeout(timeout)
      
      console.log('✓ Successfully accessed folder!')
      console.log('  Name:', response.data.name)
      console.log('\n✅ All authentication tests passed!\n')
    } catch (error: any) {
      clearTimeout(timeout)
      
      if (error.name === 'AbortError') {
        console.error('\n❌ Request timed out after 5 seconds')
        console.error('\nThis usually means:')
        console.error('1. Network connectivity issue')
        console.error('2. Firewall blocking Google APIs')
        console.error('3. DNS resolution problem')
      } else {
        console.error('\n❌ Drive API Error:', error.message)
        console.error('Status:', error.code)
        
        if (error.code === 403) {
          console.error('\n📋 403 Forbidden - Possible causes:')
          console.error('1. Service account lacks permission to folder')
          console.error('2. Google Drive API not enabled')
          console.error('3. Folder is in a restricted Shared Drive')
          console.error('4. Domain policy blocking service accounts')
        } else if (error.code === 404) {
          console.error('\n📋 404 Not Found - Folder does not exist or is inaccessible')
        }
      }
      process.exit(1)
    }

  } catch (error: any) {
    console.error('\n❌ Authentication failed:', error.message)
    process.exit(1)
  }
}

run()
