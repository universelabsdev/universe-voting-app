import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkWrapper } from "./ClerkWrapper";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./ThemeProvider";

const queryClient = new QueryClient();

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="universe-theme">
      <ClerkWrapper>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </QueryClientProvider>
      </ClerkWrapper>
    </ThemeProvider>
  );
};
