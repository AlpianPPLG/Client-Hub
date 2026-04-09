import { MainLayout } from "@/components/layout/main-layout";
import { useListProjects } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Projects() {
  const { data: projectsData, isLoading } = useListProjects({});

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-1">Manage your active and completed design projects.</p>
          </div>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-muted-foreground">Loading projects...</div>
          ) : projectsData?.projects && projectsData.projects.length > 0 ? (
            projectsData.projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <CardTitle className="text-xl font-bold">{project.title}</CardTitle>
                    <Badge variant={project.status === "completed" ? "default" : "secondary"}>
                      {project.status.replace("_", " ")}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <div>Client: {project.clientName}</div>
                      <div>Created: {format(new Date(project.createdAt), "MMM d, yyyy")}</div>
                      {project.deadline && <div>Deadline: {format(new Date(project.deadline), "MMM d, yyyy")}</div>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg font-medium">No projects found</p>
                <p className="text-sm text-muted-foreground mt-1">When you have active projects, they will appear here.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
