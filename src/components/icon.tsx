"use client";

import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";

// Dynamic lucide icon by name (from the agent registry's `icon` field).
export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name];
  if (!Cmp) return <Icons.Circle {...props} />;
  return <Cmp {...props} />;
}
