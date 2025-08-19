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
    
    await dbConnect();
    console.log('[API] Connected to database');

    
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

    
    const project = await Project.create(projectData);
    console.log('[API] Project created successfully with ID:', project._id);

    return NextResponse.json({ success: true, data: project }, { status: 201 });
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
    await dbConnect();
    console.log('[API] Connected to database');

    console.log('[API] Finding projects for slackUserId:', user.id);
    
    const projects = await Project.find({ slackUserId: user.id })
      .sort({ createdAt: -1 });
      
    console.log('[API] Found', projects.length, 'projects');
    
    
    const modelName = Project.collection.name;
    console.log('[API] Projects are stored in collection:', modelName);

    return NextResponse.json({ success: true, data: projects }, { status: 200 });
  } catch (error: any) {
    console.error('[API] Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch projects' },
      { status: 400 }
    );
  }
}
