/**
 * Diagnostic script to test Google Drive permissions and folder access
 * Run: pnpm run tsx scripts/test-google-drive.ts
 */

import { google } from 'googleapis'

const getCredentials = () => {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
  if (!raw) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 env var.')
  }
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf-8')
    return JSON.parse(decoded)
  } catch {
    throw new Error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON_BASE64.')
  }
}

const run = async () => {
  console.log('\n=================================================')
  console.log('Google Drive Permissions Diagnostic')
  console.log('=================================================\n')

  const credentials = getCredentials()
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

  console.log('✓ Service Account Email:', credentials.client_email)
  console.log('✓ Folder ID:', folderId)
  console.log('\n-------------------------------------------------')
  console.log('Testing Google Drive API Connection...')
  console.log('-------------------------------------------------\n')

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/documents',
    ],
  })

  const drive = google.drive({ version: 'v3', auth })

  try {
    // Test 1: Get folder metadata
    console.log('Test 1: Fetching folder metadata...')
    const folderInfo = await drive.files.get({
      fileId: folderId!,
      fields: 'id,name,owners,permissions,capabilities',
      supportsAllDrives: true,
    })

    console.log('✓ Folder Name:', folderInfo.data.name)
    console.log('✓ Folder Owners:', folderInfo.data.owners?.map(o => o.emailAddress).join(', '))
    console.log('✓ Can Create Files:', folderInfo.data.capabilities?.canAddChildren)
    console.log('✓ Can Edit:', folderInfo.data.capabilities?.canEdit)

    // Test 2: List permissions
    console.log('\nTest 2: Checking folder permissions...')
    const permissions = await drive.permissions.list({
      fileId: folderId!,
      fields: 'permissions(id,type,role,emailAddress)',
      supportsAllDrives: true,
    })

    console.log('\nFolder Permissions:')
    permissions.data.permissions?.forEach(p => {
      console.log(`  - ${p.emailAddress || p.type}: ${p.role}`)
    })

    const hasServiceAccountPermission = permissions.data.permissions?.some(
      p => p.emailAddress === credentials.client_email
    )

    if (!hasServiceAccountPermission) {
      console.log('\n❌ ERROR: Service account does NOT have permission to this folder!')
      console.log('\nTo fix:')
      console.log('1. Go to: https://drive.google.com/drive/folders/' + folderId)
      console.log('2. Right-click → Share')
      console.log('3. Add this email as Editor:')
      console.log('   ' + credentials.client_email)
      console.log('4. Uncheck "Notify people"')
      console.log('5. Click "Send"\n')
      process.exit(1)
    }

    console.log('\n✓ Service account has permission to the folder!')

    // Test 3: Try to create a test file
    console.log('\nTest 3: Creating a test Google Doc...')
    const testDoc = await drive.files.create({
      requestBody: {
        name: 'Test Document - ' + new Date().toISOString(),
        mimeType: 'application/vnd.google-apps.document',
        parents: [folderId!],
      },
      fields: 'id,webViewLink',
      supportsAllDrives: true,
    })

    console.log('✓ Test document created successfully!')
    console.log('  Document ID:', testDoc.data.id)
    console.log('  URL:', testDoc.data.webViewLink)

    // Test 4: Try ownership transfer
    console.log('\nTest 4: Testing ownership transfer...')
    const folderOwnerEmail = folderInfo.data.owners?.[0]?.emailAddress

    if (folderOwnerEmail) {
      try {
        await drive.permissions.create({
          fileId: testDoc.data.id!,
          requestBody: {
            type: 'user',
            role: 'owner',
            emailAddress: folderOwnerEmail,
          },
          transferOwnership: true,
          supportsAllDrives: true,
        })
        console.log('✓ Ownership transfer successful!')
        console.log('  New owner:', folderOwnerEmail)
      } catch (error: any) {
        console.log('❌ Ownership transfer failed:', error.message)
        console.log('\nThis might be because:')
        console.log('- The folder is in a Shared Drive (ownership transfer not supported)')
        console.log('- The service account needs domain-wide delegation')
        console.log('- The folder owner needs to be explicitly added\n')
      }
    }

    // Clean up test document
    console.log('\nCleaning up test document...')
    await drive.files.delete({
      fileId: testDoc.data.id!,
      supportsAllDrives: true,
    })
    console.log('✓ Test document deleted')

    console.log('\n=================================================')
    console.log('✅ ALL TESTS PASSED!')
    console.log('=================================================\n')
    console.log('Your Google Drive setup is working correctly.')
    console.log('You should be able to export to Google Docs now.\n')

  } catch (error: any) {
    console.log('\n❌ ERROR:', error.message)
    
    if (error.code === 403) {
      console.log('\n🔍 Permission Denied (403)')
      console.log('\nPossible causes:')
      console.log('1. Service account not shared with the folder')
      console.log('2. Folder is in a Shared Drive but supportsAllDrives not set')
      console.log('3. Service account lacks necessary API permissions')
      console.log('\nTo fix:')
      console.log('1. Share the folder with:', credentials.client_email)
      console.log('2. Give it "Editor" permissions')
      console.log('3. Folder URL: https://drive.google.com/drive/folders/' + folderId)
    } else if (error.code === 404) {
      console.log('\n🔍 Folder Not Found (404)')
      console.log('\nPossible causes:')
      console.log('1. Folder ID is incorrect')
      console.log('2. Folder was deleted')
      console.log('3. Service account cannot see the folder')
      console.log('\nCurrent folder ID:', folderId)
    }

    console.log('\n')
    process.exit(1)
  }
}

run().catch(console.error)
