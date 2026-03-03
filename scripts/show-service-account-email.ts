/**
 * Helper script to display the service account email from environment variables
 * This email needs to be added as an Editor to your Google Drive folder
 */

const getServiceAccountEmail = (): string => {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
  if (!raw) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 env var.')
  }
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf-8')
    const credentials = JSON.parse(decoded) as { client_email: string }
    return credentials.client_email
  } catch {
    throw new Error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON_BASE64.')
  }
}

const run = (): void => {
  console.log('\n=================================================')
  console.log('Google Service Account Email')
  console.log('=================================================\n')
  
  const email = getServiceAccountEmail()
  console.log('Service Account Email:', email)
  
  console.log('\n=================================================')
  console.log('Next Steps:')
  console.log('=================================================\n')
  console.log('1. Go to your Google Drive folder:')
  console.log(`   Folder ID: ${process.env.GOOGLE_DRIVE_FOLDER_ID}`)
  console.log('   URL: https://drive.google.com/drive/folders/' + process.env.GOOGLE_DRIVE_FOLDER_ID)
  console.log('\n2. Right-click the folder → Share')
  console.log('\n3. Add this email as Editor:')
  console.log(`   ${email}`)
  console.log('\n4. Uncheck "Notify people" (it\'s a service account)')
  console.log('\n5. Click "Send"')
  console.log('\n6. Restart the app: docker compose restart app')
  console.log('\n=================================================\n')
}

run()
