import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/app-shell";
import { CommandPaletteProvider } from "@/components/command-palette";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mb-4 inline-flex rounded-full border border-border bg-panel px-3 py-1 text-[11px] font-mono text-muted-foreground">
          404 · route not found
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">This screen doesn't exist yet.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The atlas hasn't indexed this path. Head back and try the command palette.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">Something went sideways.</h1>
        <p className="mt-2 text-sm text-muted-foreground">One of the agents choked on this view. Try again.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button>
          <a href="/" className="rounded-lg border border-border bg-panel px-4 py-2 text-sm font-medium">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Dashboard · CodeAtlas" },
      { name: "description", content: "CodeAtlas is an AI operating system for software architecture: map repositories, explore live architecture graphs, and orchestrate agents that plan, document, and ship changes." },
      { name: "author", content: "CodeAtlas" },
      { name: "theme-color", content: "#09090B" },
      { property: "og:title", content: "Dashboard · CodeAtlas" },
      { property: "og:description", content: "CodeAtlas is an AI operating system for software architecture: map repositories, explore live architecture graphs, and orchestrate agents that plan, document, and ship changes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Dashboard · CodeAtlas" },
      { name: "twitter:description", content: "CodeAtlas is an AI operating system for software architecture: map repositories, explore live architecture graphs, and orchestrate agents that plan, document, and ship changes." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/4ca9e3f0-eef8-492d-8128-73f488a4d77f" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/4ca9e3f0-eef8-492d-8128-73f488a4d77f" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body className="bg-background text-foreground">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <CommandPaletteProvider>
        <AppShell>
          <Outlet />
        </AppShell>
        <Toaster />
      </CommandPaletteProvider>
    </QueryClientProvider>
  );
}
