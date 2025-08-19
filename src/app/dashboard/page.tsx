"use client";

import { useState, useEffect } from 'react';
import { useSession, signInWithSlack } from '@/lib/auth-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckIcon, PlusIcon, TrashIcon, EditIcon, LoaderIcon } from 'lucide-react';
import { ErrorBanner } from '@/components/error-banner';
import { SuccessNotification } from '@/components/success-notification';

interface Project {
  _id: string;
  title: string;
  description: string;
  repositoryUrl?: string;
  liveUrl?: string;
  technologies: string[];
  slackUserId: string;
  slackUsername: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const session = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<'create' | 'edit'>('create');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [newTech, setNewTech] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  
  useEffect(() => {
    console.log('Session state:', { 
      isPending: session.isPending, 
      hasData: !!session.data,
      sessionData: session.data
    });
    
    if (!session.isPending) {
      if (!session.data) {
        setLoading(false);
      } else {
        fetchProjects();
      }
    }
  }, [session.isPending, session.data]);
  
  
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      const response = await fetch('/api/projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          
        },
        credentials: 'include', 
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setProjects(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch projects');
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message || 'Failed to fetch projects');
      setLoading(false);
    }
  };
  
  
  const validateUrl = (url: string, isRepo = false) => {
    
    const urlPattern = /^(https?:\/\/)?(www\.)?[^\s]+\.[^\s]+$/;
    const isValidUrl = urlPattern.test(url);
    
    if (!isValidUrl) return false;
    
    
    if (isRepo) {
      const repoPattern = /^(https?:\/\/)?(www\.)?(github\.com|gitlab\.com|bitbucket\.org)\/[^\s]+$/;
      return repoPattern.test(url);
    }
    
    return true;
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      setSubmitting(true);
      
      
      if (!title.trim()) {
        throw new Error('Project title is required');
      }
      
      if (!description.trim()) {
        throw new Error('Project description is required');
      }
      
      if (technologies.length === 0) {
        throw new Error('At least one technology is required');
      }
      
      
      if (repositoryUrl && !validateUrl(repositoryUrl, true)) {
        throw new Error('Please enter a valid repository URL (GitHub, GitLab, or BitBucket)');
      }
      
      if (liveUrl && !validateUrl(liveUrl)) {
        throw new Error('Please enter a valid URL for the live demo');
      }
      
      const projectData = {
        title: title.trim(),
        description: description.trim(),
        repositoryUrl: repositoryUrl.trim() || undefined, 
        liveUrl: liveUrl.trim() || undefined,
        technologies: technologies.filter(t => t.trim()) 
      };
      
      console.log('Submitting project data:', projectData);
      
      if (formType === 'create') {
        
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(projectData),
        });
        
        console.log('Response status:', response.status);
        
        
        const responseText = await response.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log('Response data:', responseData);
        } catch (e) {
          console.error('Failed to parse response as JSON:', responseText);
          throw new Error(`Error: ${response.statusText} (${response.status})`);
        }
        
        if (!response.ok) {
          console.error('API error details:', { 
            status: response.status, 
            statusText: response.statusText,
            data: responseData 
          });
          throw new Error(responseData.error || `Error: ${response.statusText}`);
        }
        
        
        if (responseData.success) {
          
          setProjects([responseData.data, ...projects]);
          resetForm();
          setSuccessMessage('Project created successfully!');
        } else {
          throw new Error(responseData.error || 'Failed to create project');
        }
      } else if (formType === 'edit' && currentProject) {
        
        const response = await fetch(`/api/projects/${currentProject._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(projectData),
        });
        
        
        const responseData = await response.json();
        
        if (!response.ok) {
          console.error('API error details:', { 
            status: response.status, 
            statusText: response.statusText,
            data: responseData 
          });
          throw new Error(responseData.error || `Error: ${response.statusText}`);
        }
        
        if (responseData.success) {
          
          setProjects(projects.map(p => 
            p._id === currentProject._id ? responseData.data : p
          ));
          resetForm();
          setSuccessMessage('Project updated successfully!');
        } else {
          throw new Error(responseData.error || 'Failed to update project');
        }
      }
      
      setSubmitting(false);
    } catch (err: any) {
      console.error('Error submitting project:', err);
      setError(err.message || 'Failed to submit project');
      setSubmitting(false);
    }
  };
  
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setRepositoryUrl('');
    setLiveUrl('');
    setTechnologies([]);
    setNewTech('');
    setIsFormOpen(false);
    setCurrentProject(null);
    setFormType('create');
  };
  
  
  const addTechnology = () => {
    if (newTech && !technologies.includes(newTech)) {
      setTechnologies([...technologies, newTech]);
      setNewTech('');
    }
  };
  
  
  const removeTechnology = (tech: string) => {
    setTechnologies(technologies.filter(t => t !== tech));
  };
  
  
  const handleEdit = (project: Project) => {
    setTitle(project.title);
    setDescription(project.description);
    setRepositoryUrl(project.repositoryUrl || '');
    setLiveUrl(project.liveUrl || '');
    setTechnologies([...project.technologies]);
    setCurrentProject(project);
    setFormType('edit');
    setIsFormOpen(true);
  };
  
  
  const handleDelete = async (id: string) => {
    try {
      setError(null);
      
      
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('API error details:', { 
          status: response.status, 
          statusText: response.statusText,
          data: responseData 
        });
        throw new Error(responseData.error || `Error: ${response.statusText}`);
      }
      
      if (responseData.success) {
        
        setProjects(projects.filter(p => p._id !== id));
        setSuccessMessage('Project deleted successfully!');
      } else {
        throw new Error(responseData.error || 'Failed to delete project');
      }
    } catch (err: any) {
      console.error('Error deleting project:', err);
      setError(err.message || 'Failed to delete project');
    }
  };
  
  
  if (!session.isPending && !session.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md p-6 text-center">
          <h1 className="text-2xl font-bold mb-6">Project Dashboard</h1>
          <p className="mb-6">Sign in with Slack to access your project dashboard</p>
          <Button onClick={() => signInWithSlack()}>
            Sign in with Slack
          </Button>
        </Card>
      </div>
    );
  }
  
  
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <LoaderIcon className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Project Dashboard</h1>
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
          <PlusIcon className="mr-2 h-4 w-4" /> Add Project
        </Button>
      </div>
      
      <ErrorBanner 
        message={error} 
        onDismiss={() => setError(null)} 
        autoHideDuration={6000} 
      />
      
      <SuccessNotification
        message={successMessage}
        onDismiss={() => setSuccessMessage(null)}
        autoHideDuration={3000}
      />
      
      {/* Project Form */}
      {isFormOpen && (
        <Card className="mb-8 p-6">
          <h2 className="text-xl font-bold mb-4">
            {formType === 'create' ? 'Add New Project' : 'Edit Project'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="title">Project Title</Label>
                <Input 
                  id="title"
                  placeholder="Enter project title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe your project"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="repo">Repository URL (Optional)</Label>
                <Input 
                  id="repo"
                  placeholder="https:
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="live">Live URL (Optional)</Label>
                <Input 
                  id="live"
                  placeholder="https:
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Technologies Used</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {technologies.map((tech) => (
                    <div 
                      key={tech} 
                      className="flex items-center bg-primary/10 text-primary rounded-full px-3 py-1"
                    >
                      <span>{tech}</span>
                      <button 
                        type="button"
                        onClick={() => removeTechnology(tech)}
                        className="ml-2 text-primary hover:text-primary-darker"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add technology (e.g. React, Node.js)"
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                  />
                  <Button 
                    type="button" 
                    onClick={addTechnology}
                    variant="outline"
                  >
                    Add
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  ) : formType === 'create' ? 'Create Project' : 'Update Project'}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}
      
      {/* Project List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <ProjectList 
            projects={projects} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        </TabsContent>
        
        <TabsContent value="pending">
          <ProjectList 
            projects={projects.filter(p => p.status === 'pending')} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        </TabsContent>
        
        <TabsContent value="approved">
          <ProjectList 
            projects={projects.filter(p => p.status === 'approved')} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        </TabsContent>
        
        <TabsContent value="rejected">
          <ProjectList 
            projects={projects.filter(p => p.status === 'rejected')} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

function ProjectList({ projects, onEdit, onDelete }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No projects found</p>
      </div>
    );
  }
  
  return (
    <div className="grid gap-6">
      {projects.map((project) => (
        <Card key={project._id} className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold">{project.title}</h3>
              <p className="text-sm text-muted-foreground">
                Submitted on {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(project)}
              >
                <EditIcon className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onDelete(project._id)}
                className="text-red-500 hover:text-red-600"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="mb-4">
            <p>{project.description}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Technologies</h4>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <div 
                  key={tech} 
                  className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs"
                >
                  {tech}
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            {project.repositoryUrl && (
              <div>
                <h4 className="font-semibold text-sm">Repository</h4>
                <a 
                  href={project.repositoryUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  {project.repositoryUrl}
                </a>
              </div>
            )}
            
            {project.liveUrl && (
              <div>
                <h4 className="font-semibold text-sm">Live Demo</h4>
                <a 
                  href={project.liveUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  {project.liveUrl}
                </a>
              </div>
            )}
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Status:</span>
              <StatusBadge status={project.status} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: Project['status'] }) {
  let color = '';
  let label = '';
  
  switch (status) {
    case 'pending':
      color = 'bg-yellow-100 text-yellow-800';
      label = 'Pending Review';
      break;
    case 'approved':
      color = 'bg-green-100 text-green-800';
      label = 'Approved';
      break;
    case 'rejected':
      color = 'bg-red-100 text-red-800';
      label = 'Rejected';
      break;
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
