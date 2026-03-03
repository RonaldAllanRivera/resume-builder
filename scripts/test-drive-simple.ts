/**
 * Simple Google Drive API test
 */

import { google } from 'googleapis'

const run = async () => {
  console.log('\n🔍 Testing Google Drive API...\n')

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
  if (!raw) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON_BASE64')

  const credentials = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'))
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

  console.log('Service Account:', credentials.client_email)
  console.log('Folder ID:', folderId)
  console.log('Project ID:', credentials.project_id)
  console.log()

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  const drive = google.drive({ version: 'v3', auth })

  try {
    console.log('Test 1: Get folder info...')
    const folder = await drive.files.get({
      fileId: folderId!,
      fields: 'id,name,mimeType,driveId,capabilities',
      supportsAllDrives: true,
    })

    console.log('✓ Folder Name:', folder.data.name)
    console.log('✓ Drive ID:', folder.data.driveId || 'My Drive')
    console.log('✓ Can Add Children:', folder.data.capabilities?.canAddChildren)
    console.log()

    console.log('Test 2: Create a simple text file...')
    const file = await drive.files.create({
      requestBody: {
        name: 'Test-' + Date.now() + '.txt',
        parents: [folderId!],
        mimeType: 'text/plain',
      },
      media: {
        mimeType: 'text/plain',
        body: 'Test content',
      },
      fields: 'id,webViewLink',
      supportsAllDrives: true,
    })

    console.log('✓ File created!')
    console.log('  ID:', file.data.id)
    console.log('  URL:', file.data.webViewLink)
    console.log()

    console.log('Test 3: Delete the test file...')
    await drive.files.delete({
      fileId: file.data.id!,
      supportsAllDrives: true,
    })
    console.log('✓ File deleted')
    console.log()

    console.log('✅ All tests passed! Google Drive is working.\n')
  } catch (error) {
    const err = error as { message: string; code?: number; errors?: Array<{ message: string }> }
    console.error('\n❌ Error:', err.message)
    console.error('Status:', err.code)
    console.error('Details:', err.errors?.[0]?.message || 'No details')

    if (err.code === 403) {
      console.log('\n📋 Troubleshooting 403 Error:')
      console.log('1. Check Google Cloud Console:')
      console.log(
        '   https://console.cloud.google.com/apis/dashboard?project=' + credentials.project_id,
      )
      console.log('2. Enable these APIs:')
      console.log('   - Google Drive API')
      console.log('   - Google Docs API')
      console.log('3. Check service account permissions')
      console.log('4. Verify folder is not in a restricted Shared Drive')
    }
    console.log()
    process.exit(1)
  }
}

run()
