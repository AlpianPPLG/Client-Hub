import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  company: z.string().optional(),
});

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register, user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      company: "",
    },
  });

  const onLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      await login(data);
      toast({ title: "Welcome back!" });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error?.message || "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  const onRegisterSubmit = async (data: z.infer<typeof registerSchema>) => {
    try {
      await register(data);
      toast({ title: "Account created successfully!" });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error?.message || "Could not create account",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Palette className="h-8 w-8" />
          <h1 className="text-2xl font-bold tracking-tight">StudioPortal</h1>
        </div>
        <div>
          <h2 className="text-4xl font-bold mb-6">Where creativity meets business.</h2>
          <p className="text-lg text-primary-foreground/80 max-w-md leading-relaxed">
            A refined space for managing your design projects, requests, and deliverables. Polished, professional, and built for collaboration.
          </p>
        </div>
        <div className="text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} StudioPortal. All rights reserved.
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8 text-primary">
            <Palette className="h-8 w-8" />
            <h1 className="text-2xl font-bold tracking-tight">StudioPortal</h1>
          </div>

          <Card className="border-none shadow-xl bg-card">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                {isLogin ? "Welcome back" : "Create an account"}
              </CardTitle>
              <CardDescription className="text-center">
                {isLogin
                  ? "Enter your credentials to access your portal"
                  : "Sign up to start your design journey with us"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLogin ? (
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loginForm.formState.isSubmitting}>
                      {loginForm.formState.isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                      Sign In
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Inc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-11 text-base font-medium" disabled={registerForm.formState.isSubmitting}>
                      {registerForm.formState.isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                      Create Account
                    </Button>
                  </form>
                </Form>
              )}

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </span>
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-medium text-primary hover:underline transition-all"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
