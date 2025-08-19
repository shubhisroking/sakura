import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb/connection';
import { Project } from '@/lib/mongodb/models/project';


import { cookies } from 'next/headers';

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
