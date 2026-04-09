import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function Settings() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account preferences.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your personal and account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={user?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={user?.company || "Not provided"} disabled />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={user?.role || ""} className="capitalize" disabled />
            </div>
            <div className="text-sm text-muted-foreground pt-4">
              Member since {user?.createdAt ? format(new Date(user.createdAt), "MMMM d, yyyy") : "Unknown"}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
