import { createFileRoute } from "@tanstack/react-router";
import FamilyMedApp from "@/components/FamilyMedApp";

export const Route = createFileRoute("/")({
  component: FamilyMedApp,
});
