import { MainLayout } from "@/components/layout/main-layout";
import { useListRequests } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { Plus } from "lucide-react";

export default function Requests() {
  const { data: requestsData, isLoading } = useListRequests({});

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Requests</h1>
            <p className="text-muted-foreground mt-1">Submit and track your design project requests.</p>
          </div>
          <Link href="/requests/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Request
            </Button>
          </Link>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-muted-foreground">Loading requests...</div>
          ) : requestsData?.requests && requestsData.requests.length > 0 ? (
            requestsData.requests.map((request) => (
              <Link key={request.id} href={`/requests/${request.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <CardTitle className="text-xl font-bold">{request.title}</CardTitle>
                    <Badge variant={request.status === "approved" ? "default" : request.status === "rejected" ? "destructive" : "secondary"}>
                      {request.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{request.description}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <div className="capitalize">Service: {request.serviceType.replace("_", " ")}</div>
                      <div>Client: {request.clientName}</div>
                      <div>Submitted: {format(new Date(request.createdAt), "MMM d, yyyy")}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg font-medium">No requests found</p>
                <p className="text-sm text-muted-foreground mt-1">Submit a new request to get started.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
