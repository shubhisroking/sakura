import { initializeAirtable } from './airtable';

// Function to initialize all required services
export async function initializeServices() {
  console.log('Initializing services...');

  // Initialize Airtable
  const airtableResult = await initializeAirtable();
  console.log(airtableResult.message);

  // Add other service initializations here as needed

  return {
    airtable: airtableResult
  };
}

// Run initialization in development mode
if (process.env.NODE_ENV === 'development') {
  initializeServices().then(results => {
    console.log('Service initialization results:', results);
  }).catch(error => {
    console.error('Failed to initialize services:', error);
  });
}
