import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { useSession } from "@/entities/session";
import { queryClient, setUnauthorizedHandler } from "@/shared/api";
import { router } from "./router/router";
import "./styles/index.css";

// Refresh token rejected: drop the session; RequireAuth sends the user to /login.
setUnauthorizedHandler(() => {
  useSession.getState().expire();
  queryClient.clear();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
