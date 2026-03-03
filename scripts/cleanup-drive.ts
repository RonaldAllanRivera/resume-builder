#!/usr/bin/env tsx
/**
 * Cleanup orphaned files in service account's Drive
 */

import { google } from 'googleapis'
import dotenv from 'dotenv'

dotenv.config()

async function cleanup() {
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 || '', 'base64').toString('utf-8'),
  )

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  const drive = google.drive({ version: 'v3', auth })

  console.log('Fetching files owned by service account...')

  const response = await drive.files.list({
    q: "trashed=false",
    fields: 'files(id, name, mimeType, createdTime, owners)',
    pageSize: 100,
  })

  const files = response.data.files || []
  console.log(`Found ${files.length} files`)

  for (const file of files) {
    console.log(`- ${file.name} (${file.id}) - ${file.mimeType}`)
    
    // Delete orphaned Google Docs
    if (file.mimeType === 'application/vnd.google-apps.document') {
      console.log(`  Deleting orphaned document: ${file.name}`)
      await drive.files.delete({ fileId: file.id! })
    }
  }

  console.log('Cleanup complete!')
}

cleanup().catch(console.error)
