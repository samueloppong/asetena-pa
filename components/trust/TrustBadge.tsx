import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrustLabel } from "@/lib/types";

const LABEL_TEXT: Record<TrustLabel, string> = {
  highly_trusted: "Highly trusted",
  trusted: "Trusted",
  building_trust: "Building trust",
  new_member: "New member",
};

const LABEL_STYLES: Record<TrustLabel, string> = {
  highly_trusted: "bg-verified/10 text-verified",
  trusted: "bg-accent text-primary",
  building_trust: "bg-secondary text-muted-foreground",
  new_member: "bg-muted text-muted-foreground",
};

interface TrustBadgeProps {
  score: number;
  label: TrustLabel;
  className?: string;
  showScore?: boolean;
}

export function TrustBadge({
  score,
  label,
  className,
  showScore = true,
}: TrustBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        LABEL_STYLES[label],
        className
      )}
    >
      <ShieldCheck className="size-3" />
      {LABEL_TEXT[label]}
      {showScore && <span className="opacity-70">· {score}</span>}
    </span>
  );
}
