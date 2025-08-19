import Airtable from 'airtable';

// Initialize Airtable with API key
const airtable = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
});

// Base ID will need to be set based on your Airtable workspace
const BASE_ID = process.env.AIRTABLE_BASE_ID;

// Get base reference - with error handling
export const base = () => {
  if (!process.env.AIRTABLE_API_KEY) {
    throw new Error("Missing AIRTABLE_API_KEY environment variable");
  }
  
  if (!BASE_ID) {
    throw new Error("Missing AIRTABLE_BASE_ID environment variable");
  }
  
  return airtable.base(BASE_ID);
};

// Table names
export const TABLES = {
  PROJECTS: 'Projects',
  TIMER_SESSIONS: 'TimerSessions',
  USERS: 'Users',
};

// Table schemas definitions
export const TABLE_SCHEMAS = {
  [TABLES.PROJECTS]: {
    Name: { type: 'singleLineText', required: true },
    Description: { type: 'multilineText', required: false },
    UserId: { type: 'singleLineText', required: true },
    TotalHours: { type: 'number', required: true, defaultValue: 0 },
    CreatedAt: { type: 'dateTime', required: true },
    UpdatedAt: { type: 'dateTime', required: true }
  },
  [TABLES.TIMER_SESSIONS]: {
    UserId: { type: 'singleLineText', required: true },
    ProjectId: { type: 'singleLineText', required: true },
    StartTime: { type: 'dateTime', required: true },
    EndTime: { type: 'dateTime', required: false },
    Duration: { type: 'number', required: true, defaultValue: 0 },
    CreatedAt: { type: 'dateTime', required: true },
    UpdatedAt: { type: 'dateTime', required: true }
  },
  [TABLES.USERS]: {
    Name: { type: 'singleLineText', required: true },
    Email: { type: 'email', required: true },
    CreatedAt: { type: 'dateTime', required: true }
  }
};

// Function to check if a table exists
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    // Try to get 1 record from the table to check if it exists
    await base().table(tableName).select({ maxRecords: 1 }).all();
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '';
    // If error contains "could not find" or similar, the table doesn't exist
    if (errorMessage.includes('could not find') || 
        errorMessage.includes('not found') || 
        errorMessage.includes('does not exist')) {
      return false;
    }
    // Re-throw if it's a different error
    throw error;
  }
}

// Function to create a table in Airtable
export async function createTable(tableName: string): Promise<void> {
  try {
    // We need to use the Airtable Meta API to create tables
    // This requires the user to have appropriate permissions
    // Note: Airtable doesn't have a direct API for table creation
    // This is a workaround using the API
    
    // First check if table exists
    const exists = await tableExists(tableName);
    if (exists) {
      console.log(`Table ${tableName} already exists`);
      return;
    }
    
    // Since Airtable doesn't provide a direct API for table creation,
    // we'll need to use a REST API call or notify the user
    console.log(`Table ${tableName} doesn't exist. Creating automatically...`);
    
    // Note: Creating tables programmatically is limited in Airtable's API
    // This is a limitation of Airtable, not our code
    
    // Throw a more helpful error message
    throw new Error(`Table ${tableName} doesn't exist. Please create it manually in Airtable with the following fields: ${Object.keys(TABLE_SCHEMAS[tableName]).join(', ')}`);
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, error);
    throw error;
  }
}

// Function to ensure all required tables exist
export async function ensureTablesExist(): Promise<{ success: boolean, message: string }> {
  try {
    const results = [];
    
    for (const tableName of Object.values(TABLES)) {
      try {
        const exists = await tableExists(tableName);
        if (!exists) {
          try {
            await createTable(tableName);
            results.push(`Created table ${tableName}`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            results.push(`Failed to create table ${tableName}: ${errorMessage}`);
          }
        } else {
          results.push(`Table ${tableName} already exists`);
        }
      } catch (error) {
        console.error(`Error checking/creating table ${tableName}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push(`Error checking table ${tableName}: ${errorMessage}`);
      }
    }
    
    return {
      success: !results.some(result => result.includes('Failed') || result.includes('Error')),
      message: results.join('\n')
    };
  } catch (error) {
    console.error("Error ensuring tables exist:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Error ensuring tables exist: ${errorMessage}`
    };
  }
}

// Initialize Airtable - Call this when the application starts
export async function initializeAirtable(): Promise<{ success: boolean, message: string }> {
  console.log('Initializing Airtable...');
  
  try {
    // Check environment variables
    if (!process.env.AIRTABLE_API_KEY) {
      return {
        success: false,
        message: 'Missing AIRTABLE_API_KEY environment variable'
      };
    }
    
    if (!process.env.AIRTABLE_BASE_ID) {
      return {
        success: false,
        message: 'Missing AIRTABLE_BASE_ID environment variable'
      };
    }
    
    // Check if we can connect to Airtable
    try {
      const testBase = base();
      // Just accessing the base object to test connection
      if (!testBase) {
        throw new Error('Failed to connect to Airtable base');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Failed to connect to Airtable: ${errorMessage}`
      };
    }
    
    // Ensure all tables exist
    const tablesResult = await ensureTablesExist();
    
    return {
      success: tablesResult.success,
      message: `Airtable initialization ${tablesResult.success ? 'successful' : 'failed'}: ${tablesResult.message}`
    };
  } catch (error) {
    console.error('Error initializing Airtable:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Error initializing Airtable: ${errorMessage}`
    };
  }
}

// Helper function to create a project in Airtable
export async function createProject(data: {
  name: string;
  description?: string;
  userId: string;
}) {
  try {
    // Ensure the Projects table exists
    const exists = await tableExists(TABLES.PROJECTS);
    if (!exists) {
      await createTable(TABLES.PROJECTS);
    }
    
    return base().table(TABLES.PROJECTS).create([
      {
        fields: {
          Name: data.name,
          Description: data.description || '',
          UserId: data.userId,
          TotalHours: 0,
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString(),
        },
      },
    ]);
  } catch (error) {
    console.error("Error in createProject:", error);
    throw error;
  }
}

// Helper function to fetch projects by userId
export async function getProjectsByUserId(userId: string) {
  try {
    // Ensure the Projects table exists
    const exists = await tableExists(TABLES.PROJECTS);
    if (!exists) {
      await createTable(TABLES.PROJECTS);
      // If we just created the table, there won't be any projects yet
      return [];
    }

    const records = await base().table(TABLES.PROJECTS)
      .select({
        filterByFormula: `{UserId} = '${userId}'`,
        sort: [{ field: 'UpdatedAt', direction: 'desc' }],
      })
      .all();

    return records.map((record: any) => ({
      id: record.id,
      name: record.get('Name'),
      description: record.get('Description'),
      userId: record.get('UserId'),
      totalHours: record.get('TotalHours') || 0,
      createdAt: record.get('CreatedAt'),
      updatedAt: record.get('UpdatedAt'),
    }));
  } catch (error) {
    console.error("Error in getProjectsByUserId:", error);
    throw error;
  }
}

// Helper function to create a timer session
export async function createTimerSession(data: {
  userId: string;
  projectId: string;
}) {
  try {
    // Ensure the TimerSessions table exists
    const exists = await tableExists(TABLES.TIMER_SESSIONS);
    if (!exists) {
      await createTable(TABLES.TIMER_SESSIONS);
    }
    
    const records = await base().table(TABLES.TIMER_SESSIONS).create([
      {
        fields: {
          UserId: data.userId,
          ProjectId: data.projectId,
          StartTime: new Date().toISOString(),
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString(),
          Duration: 0,
        },
      },
    ]);

    const record = records[0];
    return {
      id: record.id,
      userId: record.get('UserId'),
      projectId: record.get('ProjectId'),
      startTime: record.get('StartTime'),
    };
  } catch (error) {
    console.error("Error in createTimerSession:", error);
    throw error;
  }
}

// Helper function to update a timer session
export async function updateTimerSession(data: {
  id: string;
  endTime: string;
  duration: number;
}) {
  try {
    // Ensure both tables exist
    const timerTableExists = await tableExists(TABLES.TIMER_SESSIONS);
    if (!timerTableExists) {
      await createTable(TABLES.TIMER_SESSIONS);
      throw new Error(`Table ${TABLES.TIMER_SESSIONS} was missing but needed for update. It's been created, but the timer session may need to be restarted.`);
    }
    
    const projectsTableExists = await tableExists(TABLES.PROJECTS);
    if (!projectsTableExists) {
      await createTable(TABLES.PROJECTS);
      throw new Error(`Table ${TABLES.PROJECTS} was missing but needed for update. It's been created, but project data may need to be recreated.`);
    }
    
    const records = await base().table(TABLES.TIMER_SESSIONS).update([
      {
        id: data.id,
        fields: {
          EndTime: data.endTime,
          Duration: data.duration,
          UpdatedAt: new Date().toISOString(),
        },
      },
    ]);

    // Update the project's total hours
    const record = records[0];
    const projectId = record.get('ProjectId') as string;
    
    // Get the current project
    const projectRecords = await base().table(TABLES.PROJECTS)
      .select({
        filterByFormula: `RECORD_ID() = '${projectId}'`,
      })
      .all();
    
    if (projectRecords.length > 0) {
      const projectRecord = projectRecords[0];
      const currentHours = Number(projectRecord.get('TotalHours') || 0);
      
      // Update the project hours
      await base().table(TABLES.PROJECTS).update([
        {
          id: projectId,
          fields: {
            TotalHours: currentHours + data.duration,
            UpdatedAt: new Date().toISOString(),
          },
        },
      ]);
    } else {
      console.warn(`Project with ID ${projectId} not found when updating hours.`);
    }

    return {
      id: record.id,
      endTime: record.get('EndTime'),
      duration: record.get('Duration'),
    };
  } catch (error) {
    console.error("Error in updateTimerSession:", error);
    throw error;
  }
}
