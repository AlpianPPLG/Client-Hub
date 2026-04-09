import { MainLayout } from "@/components/layout/main-layout";
import { useCreateRequest } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const SERVICE_TYPES = ["logo_design", "branding", "web_design", "print_design", "social_media", "illustration", "other"] as const;
type ServiceType = typeof SERVICE_TYPES[number];

const requestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Please provide more details about your request"),
  serviceType: z.enum(SERVICE_TYPES),
  budget: z.coerce.number().optional(),
  timeline: z.string().optional(),
});

export default function RequestNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createRequestMutation = useCreateRequest();

  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: "",
      description: "",
      serviceType: "other",
      budget: undefined,
      timeline: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof requestSchema>) => {
    try {
      const response = await createRequestMutation.mutateAsync({
        data: {
          title: data.title,
          description: data.description,
          serviceType: data.serviceType,
          budget: data.budget || null,
          timeline: data.timeline || undefined,
        }
      });
      toast({ title: "Request submitted successfully!" });
      setLocation(`/requests/${response.id}`);
    } catch (error: any) {
      toast({
        title: "Failed to submit request",
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Project Request</h1>
          <p className="text-muted-foreground mt-1">Tell us what you need built, designed, or created.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>Fill out the form below to start a new project conversation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Title</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Brand Identity Redesign" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="branding">Branding</SelectItem>
                          <SelectItem value="logo_design">Logo Design</SelectItem>
                          <SelectItem value="web_design">Web Design</SelectItem>
                          <SelectItem value="print_design">Print Design</SelectItem>
                          <SelectItem value="social_media">Social Media</SelectItem>
                          <SelectItem value="illustration">Illustration</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your goals, requirements, and any specific ideas..."
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Budget ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Optional" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desired Timeline</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Next month, Q3, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button variant="outline" type="button" onClick={() => setLocation("/requests")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createRequestMutation.isPending}>
                    {createRequestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Request
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
