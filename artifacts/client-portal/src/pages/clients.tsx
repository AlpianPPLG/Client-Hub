import { MainLayout } from "@/components/layout/main-layout";
import { useListClients } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { format } from "date-fns";
import { Users } from "lucide-react";

export default function Clients() {
  const { data: clientsData, isLoading } = useListClients({});

  return (
    <MainLayout requireAdmin={true}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground mt-1">Manage all your client accounts and their activity.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="text-muted-foreground">Loading clients...</div>
          ) : clientsData?.clients && clientsData.clients.length > 0 ? (
            clientsData.clients.map((client) => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">{client.name}</CardTitle>
                      {client.company && <p className="text-sm text-muted-foreground">{client.company}</p>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2 text-sm mt-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email</span>
                        <span className="font-medium truncate ml-2">{client.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Projects</span>
                        <span className="font-medium">{client.activeProjects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Joined</span>
                        <span className="font-medium">{format(new Date(client.createdAt), "MMM yyyy")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <p className="text-lg font-medium">No clients found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
