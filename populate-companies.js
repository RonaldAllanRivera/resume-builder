// Run this script in the browser console on http://localhost:3000/admin
// Make sure you're logged in as admin first

async function populateCompanyNames() {
  try {
    const response = await fetch('/next/backfill-generations-company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dryRun: false,
        batchSize: 50,
        maxDocs: 1000
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Company names populated successfully:', result);
      console.log(`Updated: ${result.updated} generations`);
      console.log(`Skipped: ${result.skipped} generations`);
      
      // Refresh the page to see the updated company names
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      console.error('❌ Failed to populate companies:', result);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the function
populateCompanyNames();
