import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./core/theme/ThemeContext";
import { router } from "./routes";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
