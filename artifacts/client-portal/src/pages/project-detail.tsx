import { MainLayout } from "@/components/layout/main-layout";
import { useGetProject, getGetProjectQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);
  
  const { data: project, isLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) }
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div>Loading project...</div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div>Project not found</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
              <Badge variant={project.status === "completed" ? "default" : "secondary"}>
                {project.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">Client: {project.clientName}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{project.description}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent>
                {project.comments && project.comments.length > 0 ? (
                  <div className="space-y-4">
                    {project.comments.map(comment => (
                      <div key={comment.id} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-sm">{comment.authorName} <span className="text-xs text-muted-foreground capitalize">({comment.authorRole})</span></span>
                          <span className="text-xs text-muted-foreground">{format(new Date(comment.createdAt), "MMM d, yyyy")}</span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No comments yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Priority</div>
                  <div className="capitalize">{project.priority}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Created</div>
                  <div>{format(new Date(project.createdAt), "MMM d, yyyy")}</div>
                </div>
                {project.deadline && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Deadline</div>
                    <div>{format(new Date(project.deadline), "MMM d, yyyy")}</div>
                  </div>
                )}
                {project.budget && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Budget</div>
                    <div>${project.budget.toLocaleString()}</div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Files</CardTitle>
              </CardHeader>
              <CardContent>
                {project.files && project.files.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {project.files.map(file => (
                      <li key={file.id}>
                        <a href={file.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          {file.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No files attached.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
