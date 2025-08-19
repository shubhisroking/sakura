import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb/connection';
import { Project } from '@/lib/mongodb/models/project';


import { cookies } from 'next/headers';

async function getUserFromRequest(req: NextRequest) {
  try {
    // Log headers for debugging
    console.log('[Auth] Request headers ([id] route):', Object.fromEntries(req.headers.entries()));
    
    const cookieStore = await cookies();
    console.log('[Auth] Available cookies ([id] route):', cookieStore.getAll().map(c => c.name));
    
    const sessionCookie = cookieStore.get('better-auth.session');
    console.log('[Auth] Session cookie found ([id] route):', !!sessionCookie);
    
    if (sessionCookie?.value) {
      try {
        console.log('[Auth] Processing session cookie ([id] route)');
        const parts = sessionCookie.value.split('.');
        if (parts.length === 3) {
          console.log('[Auth] Valid JWT format ([id] route)');
          
          const payload = Buffer.from(parts[1], 'base64url').toString();
          const session = JSON.parse(payload);
          
          if (session && session.user) {
            console.log('[Auth] Valid user in session ([id] route):', session.user.id);
            return {
              id: session.user.id,
              name: session.user.name || session.user.email || 'Unknown User',
              email: session.user.email,
            };
          }
        }
      } catch (e) {
        console.error('[Auth] Error decoding session ([id] route):', e);
      }
    }
    
    // Check for authorization header (JWT token)
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log('[Auth] Found authorization header ([id] route)');
      const token = authHeader.split(' ')[1];
      
      // In production, you would validate the token here
      // For now, we'll use a fallback user in both dev and production
    }
    
    // Development AND temporary production fallback for testing
    // IMPORTANT: Remove this fallback in production once auth is properly configured
    console.log('[Auth] Using fallback user ([id] route) (TEMPORARY - remove in production)');
    return {
      id: 'dev-slack-id',
      name: 'Development User',
      email: 'dev@example.com',
    };
    
    // Uncomment this and remove the fallback once auth is properly configured
    // return null;
  } catch (error) {
    console.error('[Auth] Failed to get user ([id] route):', error);
    return null;
  }
}


export async function GET(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    
    await dbConnect();

    
    const project = await Project.findById(id);

    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    
    if (project.slackUserId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: project }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch project' },
      { status: 400 }
    );
  }
}


export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    
    await dbConnect();

    
    const project = await Project.findById(id);

    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    
    if (project.slackUserId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    
    const body = await req.json();
    const { title, description, repositoryUrl, liveUrl, technologies } = body;

    
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        title,
        description,
        repositoryUrl,
        liveUrl,
        technologies,
      },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updatedProject }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update project' },
      { status: 400 }
    );
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    
    await dbConnect();

    
    const project = await Project.findById(id);

    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    
    if (project.slackUserId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    
    await Project.findByIdAndDelete(id);

    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete project' },
      { status: 400 }
    );
  }
}
