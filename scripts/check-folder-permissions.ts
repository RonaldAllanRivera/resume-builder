#!/usr/bin/env tsx
/**
 * Check folder permissions and sharing settings
 */

import { google } from 'googleapis'
import dotenv from 'dotenv'

dotenv.config()

async function checkPermissions() {
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 || '', 'base64').toString('utf-8'),
  )

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  const drive = google.drive({ version: 'v3', auth })
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!

  console.log(`Checking folder: ${folderId}`)

  const folder = await drive.files.get({
    fileId: folderId,
    fields: 'id, name, owners, permissions, capabilities',
    supportsAllDrives: true,
  })

  console.log('\nFolder info:')
  console.log(JSON.stringify(folder.data, null, 2))

  const permissions = await drive.permissions.list({
    fileId: folderId,
    fields: 'permissions(id, type, role, emailAddress)',
    supportsAllDrives: true,
  })

  console.log('\nPermissions:')
  console.log(JSON.stringify(permissions.data, null, 2))
}

checkPermissions().catch(console.error)
