import { MainLayout } from "@/components/layout/main-layout";
import { useGetClient, getGetClientQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function ClientDetail() {
  const { id } = useParams();
  const clientId = parseInt(id || "0", 10);
  
  const { data: client, isLoading } = useGetClient(clientId, {
    query: { enabled: !!clientId, queryKey: getGetClientQueryKey(clientId) }
  });

  if (isLoading) {
    return (
      <MainLayout requireAdmin={true}>
        <div>Loading client details...</div>
      </MainLayout>
    );
  }

  if (!client) {
    return (
      <MainLayout requireAdmin={true}>
        <div>Client not found</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout requireAdmin={true}>
      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-3xl shadow-sm border border-primary/20">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            <p className="text-lg text-muted-foreground mt-1">{client.company || client.email}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Client Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Email</div>
                <div>{client.email}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Joined</div>
                <div>{format(new Date(client.createdAt), "MMM d, yyyy")}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Projects</div>
                <div>{client.projectCount}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {client.projects && client.projects.length > 0 ? (
                <div className="space-y-4">
                  {client.projects.map(project => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer mb-3 last:mb-0">
                        <div>
                          <div className="font-semibold">{project.title}</div>
                          <div className="text-sm text-muted-foreground">Created {format(new Date(project.createdAt), "MMM d, yyyy")}</div>
                        </div>
                        <Badge variant={project.status === "completed" ? "default" : "secondary"}>
                          {project.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No projects for this client.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
