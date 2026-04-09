import { createContext, useContext, ReactNode } from "react";
import { useGetMe, useLogin, useLogout, useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type User = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "client";
  company: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

type LoginData = { email: string; password: string };
type RegisterData = { name: string; email: string; password: string; company?: string };

interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useGetMe({
    query: {
      retry: false,
    },
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const handleLogin = async (data: LoginData) => {
    await loginMutation.mutateAsync({ data });
    await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };

  const handleRegister = async (data: RegisterData) => {
    await registerMutation.mutateAsync({ data });
    await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    queryClient.setQueryData(getGetMeQueryKey(), null);
    await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };

  return (
    <AuthContext.Provider
      value={{
        user: error ? null : (user as User | undefined),
        isLoading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
