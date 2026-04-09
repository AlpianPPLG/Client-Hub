import { MainLayout } from "@/components/layout/main-layout";
import { useGetRequest, getGetRequestQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function RequestDetail() {
  const { id } = useParams();
  const requestId = parseInt(id || "0", 10);
  
  const { data: request, isLoading } = useGetRequest(requestId, {
    query: { enabled: !!requestId, queryKey: getGetRequestQueryKey(requestId) }
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div>Loading request...</div>
      </MainLayout>
    );
  }

  if (!request) {
    return (
      <MainLayout>
        <div>Request not found</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{request.title}</h1>
              <Badge variant={request.status === "approved" ? "default" : request.status === "rejected" ? "destructive" : "secondary"}>
                {request.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">Client: {request.clientName}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{request.description}</p>
              </CardContent>
            </Card>
            
            {request.adminNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Admin Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{request.adminNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Service Type</div>
                  <div className="capitalize">{request.serviceType.replace("_", " ")}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Submitted</div>
                  <div>{format(new Date(request.createdAt), "MMM d, yyyy")}</div>
                </div>
                {request.timeline && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Requested Timeline</div>
                    <div>{request.timeline}</div>
                  </div>
                )}
                {request.budget && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Estimated Budget</div>
                    <div>${request.budget.toLocaleString()}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
