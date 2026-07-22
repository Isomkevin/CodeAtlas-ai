import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "./index";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · CodeAtlas" }] }),
  component: Dashboard,
});
