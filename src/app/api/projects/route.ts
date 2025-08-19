import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb/connection';
import { Project } from '@/lib/mongodb/models/project';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';

async function getUserFromRequest(req: NextRequest) {
  try {
    
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('better-auth.session');
    
    if (sessionCookie?.value) {
      try {
        
        const parts = sessionCookie.value.split('.');
        if (parts.length === 3) {
          
          const payload = Buffer.from(parts[1], 'base64url').toString();
          const session = JSON.parse(payload);
          
          if (session && session.user) {
            return {
              id: session.user.id,
              name: session.user.name || session.user.email || 'Unknown User',
              email: session.user.email,
            };
          }
        }
      } catch (e) {
        console.error('Error decoding session:', e);
      }
    }
    
    
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      
      
      if (process.env.NODE_ENV !== 'production') {
        return {
          id: 'dev-slack-id',
          name: 'Development User',
          email: 'dev@example.com',
        };
      }
    }
    
    
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Using development fallback user');
      return {
        id: 'dev-slack-id',
        name: 'Development User',
        email: 'dev@example.com',
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}


export async function POST(req: NextRequest) {
  try {
    
    if (process.env.NODE_ENV !== 'production') {
      
      console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    }
    
    
    const user = await getUserFromRequest(req);
    
    if (!user) {
      console.error('Authentication failed: No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    
    const slackUserId = user.id;
    const slackUsername = user.name || user.email || 'Unknown User';
    console.log('[API] User authenticated:', { slackUserId, slackUsername });

    
    const body = await req.json().catch(e => {
      console.error('[API] Failed to parse request body:', e);
      throw new Error('Invalid request body');
    });
    
    console.log('[API] Request body:', body);
    
    const { title, description, repositoryUrl, liveUrl, technologies } = body;

    
    if (!title) throw new Error('Title is required');
    if (!description) throw new Error('Description is required');
    if (!technologies || !Array.isArray(technologies) || technologies.length === 0) {
      throw new Error('At least one technology is required');
    }

    console.log('[API] Connecting to database...');
    
    try {
      await dbConnect();
      console.log('[API] Connected to database successfully');
      
      // Verify database connection is active
      const mongoose = global.mongooseCache.conn;
      if (mongoose && mongoose.connection) {
        console.log('[API] MongoDB connection state:', mongoose.connection.readyState);
        if (mongoose.connection.db) {
          console.log('[API] Connected to database:', mongoose.connection.db.databaseName);
        }
      } else {
        console.warn('[API] Connected but mongoose connection object is undefined');
      }
    } catch (dbError: any) {
      console.error('[API] Database connection error:', dbError);
      throw new Error(`Database connection failed: ${dbError?.message || 'Unknown error'}`);
    }

    
    const projectData = {
      title,
      description,
      repositoryUrl: repositoryUrl || undefined,
      liveUrl: liveUrl || undefined,
      technologies,
      slackUserId,
      slackUsername,
      status: 'pending',
    };
    
    console.log('[API] Creating project with data:', projectData);
    console.log('[API] Project model collection:', Project.collection.name);
    console.log('[API] Project model collection namespace:', Project.collection.namespace);

    let createdProject;
    
    try {
      createdProject = await Project.create(projectData);
      console.log('[API] Project created successfully with ID:', createdProject._id);
      
      // Verify the project was created by fetching it back
      const verifyProject = await Project.findById(createdProject._id);
      if (verifyProject) {
        console.log('[API] Project verified in database:', verifyProject._id);
      } else {
        console.warn('[API] Project created but could not be verified in database');
      }
    } catch (createError: any) {
      console.error('[API] Error creating project in database:', createError);
      console.error('[API] Error details:', JSON.stringify(createError, null, 2));
      throw new Error(`Failed to create project: ${createError?.message || 'Unknown error'}`);
    }
    
    return NextResponse.json({ success: true, data: createdProject }, { status: 201 });

    return NextResponse.json({ success: true, data: createdProject }, { status: 201 });
  } catch (error: any) {
    console.error('[API] Error creating project:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create project' },
      { status: 400 }
    );
  }
}


export async function GET(req: NextRequest) {
  try {
    console.log('[API] GET /api/projects - Fetching projects');
    
    
    const user = await getUserFromRequest(req);
    
    if (!user) {
      console.error('[API] Authentication failed: No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[API] User authenticated:', { id: user.id, name: user.name });

    
    console.log('[API] Connecting to database...');
    
    try {
      await dbConnect();
      console.log('[API] Connected to database successfully');
      
      // Verify database connection is active
      const mongoose = global.mongooseCache.conn;
      if (mongoose && mongoose.connection) {
        console.log('[API] MongoDB connection state:', mongoose.connection.readyState);
        if (mongoose.connection.db) {
          console.log('[API] Connected to database:', mongoose.connection.db.databaseName);
        }
      }
    } catch (dbError: any) {
      console.error('[API] Database connection error:', dbError);
      throw new Error(`Database connection failed: ${dbError?.message || 'Unknown error'}`);
    }

    console.log('[API] Finding projects for slackUserId:', user.id);
    
    let foundProjects;
    try {
      foundProjects = await Project.find({ slackUserId: user.id })
        .sort({ createdAt: -1 });
        
      console.log('[API] Found', foundProjects.length, 'projects');
      
      const modelName = Project.collection.name;
      const namespace = Project.collection.namespace;
      console.log('[API] Projects are stored in collection:', modelName);
      console.log('[API] Collection namespace:', namespace);
    } catch (findError: any) {
      console.error('[API] Error finding projects:', findError);
      throw new Error(`Failed to find projects: ${findError?.message || 'Unknown error'}`);
    }
    
    return NextResponse.json({ success: true, data: foundProjects }, { status: 200 });

    return NextResponse.json({ success: true, data: foundProjects }, { status: 200 });
  } catch (error: any) {
    console.error('[API] Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch projects' },
      { status: 400 }
    );
  }
}
