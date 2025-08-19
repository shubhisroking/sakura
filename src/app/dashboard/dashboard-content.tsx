"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function DashboardContent() {
  const { data, isPending } = useSession();
  const session = data;

  // If user is not authenticated, redirect to home page
  useEffect(() => {
    if (!isPending && !session) {
      redirect("/");
    }
  }, [session, isPending]);

  if (isPending) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl mb-3">Welcome, {session?.user?.name || 'User'}!</h2>
        <p className="text-muted-foreground">Manage your projects and track your time</p>
      </div>

      <Tabs defaultValue="timer" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="timer">Timer</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="timer">
          {session?.user?.id ? (
            <TimerTab userId={session.user.id} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Project Timer</CardTitle>
                <CardDescription>Please log in to use the timer</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="projects">
          {session?.user?.id ? (
            <ProjectsTab userId={session.user.id} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Your Projects</CardTitle>
                <CardDescription>Please log in to manage projects</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TimerTab({ userId }: { userId: string }) {
  const [activeProject, setActiveProject] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerSessionId, setTimerSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects and check for active timer
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Check for active timer
        const timerData = localStorage.getItem(`timer_${userId}`);
        if (timerData) {
          const { projectId, start, sessionId } = JSON.parse(timerData);
          setTimerSessionId(sessionId);
          setStartTime(new Date(start));
          setIsTimerRunning(true);
        }
        
        await fetchProjects();
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load projects");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [userId]);

  // Update timer
  useEffect(() => {
    if (!isTimerRunning || !startTime) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = (now.getTime() - startTime.getTime()) / 1000;
      setElapsedTime(elapsed);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isTimerRunning, startTime]);

  async function fetchProjects() {
    try {
      const response = await fetch(`/api/projects?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      const projectsData = data.projects || [];
      
      // Normalize projects format from Airtable
      setProjects(projectsData);
      
      // Set active project if timer running
      if (isTimerRunning) {
        const timerData = localStorage.getItem(`timer_${userId}`);
        if (timerData) {
          const { projectId } = JSON.parse(timerData);
          const project = projectsData.find((p: any) => p.id === projectId);
          if (project) setActiveProject(project);
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setError("Failed to fetch projects");
      setProjects([]);
    }
  }

  async function startTimer(projectId: string) {
    try {
      const start = new Date();
      
      // Update UI first
      setStartTime(start);
      setIsTimerRunning(true);
      setElapsedTime(0);
      
      // Create session
      const response = await fetch("/api/projects/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, userId })
      });
      
      const data = await response.json();
      setTimerSessionId(data.id);
      
      // Store in localStorage
      localStorage.setItem(`timer_${userId}`, JSON.stringify({
        projectId,
        start: start.toISOString(),
        sessionId: data.id
      }));
    } catch (error) {
      console.error("Failed to start timer:", error);
    }
  }

  async function stopTimer() {
    if (!startTime || !timerSessionId) return;
    
    try {
      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      // Update UI
      setIsTimerRunning(false);
      localStorage.removeItem(`timer_${userId}`);
      
      // Update backend
      await fetch("/api/projects/sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: timerSessionId, 
          endTime: endTime.toISOString(),
          duration
        })
      });
      
      // Refresh projects to get updated hours
      await fetchProjects();
      
      // Reset state
      setTimerSessionId(null);
      setStartTime(null);
      setActiveProject(null);
    } catch (error) {
      console.error("Failed to stop timer:", error);
    }
  }

  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Helper function to parse project data from Airtable
  function parseProjectData(project: any) {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      userId: project.userId,
      totalHours: parseFloat(project.totalHours || '0'),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Timer</CardTitle>
          <CardDescription>Loading your projects...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Timer</CardTitle>
          <CardDescription>There was a problem</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button onClick={() => fetchProjects()} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Project Timer</CardTitle>
          <CardDescription>Track time for your projects</CardDescription>
        </CardHeader>
        <CardContent>
          {isTimerRunning && activeProject ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-medium mb-1">Currently tracking:</h3>
                <p className="text-2xl font-bold mb-4">{activeProject.name}</p>
                <div className="text-4xl font-mono my-8">{formatTime(elapsedTime)}</div>
              </div>
              <Button 
                variant="destructive" 
                size="lg" 
                className="w-full"
                onClick={stopTimer}
              >
                Stop Timer
              </Button>
            </div>
          ) : (
            <div>
              <h3 className="mb-4">Select a project to track time:</h3>
              
              {!projects || projects.length === 0 ? (
                <div className="text-center p-6">
                  <p className="mb-4">You don't have any projects yet.</p>
                  <Link href="#" onClick={() => document.querySelector('[value="projects"]')?.dispatchEvent(new MouseEvent('click'))}>
                    <Button variant="outline">Create Your First Project</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-3">
                  {projects.map((project) => (
                    <Card key={project.id} className="p-0 overflow-hidden">
                      <div className="flex justify-between items-center p-4">
                        <div>
                          <h4 className="font-medium">{project.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Total: {(parseFloat(project.totalHours) || 0).toFixed(2)} hours
                          </p>
                        </div>
                        <Button onClick={() => {
                          setActiveProject(project);
                          startTimer(project.id);
                        }}>
                          Start Timer
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectsTab({ userId }: { userId: string }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [userId]);

  async function fetchProjects() {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/projects?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setError("Failed to load projects");
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      // Clear form
      const projectData = { ...newProject };
      setNewProject({ name: "", description: "" });
      setIsCreating(false);
      
      // Create project
      const response = await fetch("/api/projects/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectData.name,
          description: projectData.description,
          userId
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to create project");
      }
      
      // Refresh project list
      await fetchProjects();
    } catch (error) {
      console.error("Failed to create project:", error);
      setError("Failed to create project");
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Projects</CardTitle>
          <CardDescription>Loading your projects...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Projects</CardTitle>
            <CardDescription>Manage and create projects to track time for</CardDescription>
          </div>
          <Button onClick={() => setIsCreating(!isCreating)}>
            {isCreating ? "Cancel" : "New Project"}
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4">
              {error}
              <Button variant="outline" size="sm" className="ml-2" onClick={() => fetchProjects()}>
                Retry
              </Button>
            </div>
          )}
        
          {isCreating && (
            <form onSubmit={createProject} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Project Name</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-input px-3 py-2"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <textarea
                  className="w-full rounded-md border border-input px-3 py-2"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                />
              </div>
              <Button type="submit">Create Project</Button>
            </form>
          )}

          {!projects || projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No projects found</p>
              {!isCreating && (
                <Button onClick={() => setIsCreating(true)}>Create Your First Project</Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="p-4">
                  <h3 className="font-medium text-lg">{project.name}</h3>
                  {project.description && (
                    <p className="text-muted-foreground mt-1">{project.description}</p>
                  )}
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm">
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-medium">
                      {(parseFloat(project.totalHours) || 0).toFixed(2)} hours
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
