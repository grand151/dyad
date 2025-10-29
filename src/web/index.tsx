import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { router } from "../router";
import { RouterProvider } from "@tanstack/react-router";
import { PostHogProvider } from "posthog-js/react";
import posthog from "posthog-js";
import { getTelemetryUserId, isTelemetryOptedIn } from "../hooks/useSettings";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from "@tanstack/react-query";
import { showError, showMcpConsentToast } from "../lib/toast";
import { initializeServiceWorker } from "./service-worker";
import { isWeb } from "../lib/platform";

console.log("Running Dyad in web mode");

interface MyMeta extends Record<string, unknown> {
  showErrorToast: boolean;
}

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: MyMeta;
    mutationMeta: MyMeta;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.showErrorToast) {
        showError(error);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.showErrorToast) {
        showError(error);
      }
    },
  }),
});

function App() {
  // Initialize PostHog if telemetry is enabled
  const telemetryEnabled = isTelemetryOptedIn();
  if (telemetryEnabled) {
    const userId = getTelemetryUserId();
    posthog.init("phc_5hSRSwJZtx0yOwH7mVLLfZE4YvMHIaYKPSq9kpGdL0N", {
      api_host: "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
    });
    posthog.identify(userId);
  }

  return (
    <StrictMode>
      <PostHogProvider client={posthog}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </PostHogProvider>
    </StrictMode>
  );
}

// Initialize PWA service worker
if (isWeb()) {
  initializeServiceWorker();
}

// Mount the app
createRoot(document.getElementById("root")!).render(<App />);
