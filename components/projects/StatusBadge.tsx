import { Badge } from "@/components/primitives/Badge";
import type { ProjectStatus } from "@/lib/content";

export function StatusBadge({ status }: { status: ProjectStatus }) {
  if (status === "live") {
    return <Badge tone="success">Live</Badge>;
  }
  if (status === "research") {
    return <Badge tone="accent">In research</Badge>;
  }
  return <Badge tone="ink">Archived</Badge>;
}
