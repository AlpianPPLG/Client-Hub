import { useState, createContext, useContext, useEffect, ReactNode } from "react";
import { useGetMe, useLogin, useLogout, useRegister } from "@workspace/api-client-react";
import { User, LoginBody, RegisterBody } from "@workspace/api-client-react/src/generated/api.schemas";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  login: (data: LoginBody) => Promise<void>;
  register: (data: RegisterBody) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useGetMe({
    query: {
      retry: false,
    }
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const handleLogin = async (data: LoginBody) => {
    await loginMutation.mutateAsync({ data });
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };

  const handleRegister = async (data: RegisterBody) => {
    await registerMutation.mutateAsync({ data });
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };

  return (
    <AuthContext.Provider value={{
      user: error ? null : user,
      isLoading,
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout
    }}>
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
