
import React from "react";
import { Info, AlertTriangle, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { cn } from "@/lib/utils";

type TooltipIconVariant = "info" | "warning" | "success" | "error" | "help";

interface StyledTooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  variant?: TooltipIconVariant;
  className?: string;
  contentClassName?: string;
  iconClassName?: string;
  asChild?: boolean;
}

export function StyledTooltip({
  content,
  children,
  variant = "info",
  className,
  contentClassName,
  iconClassName,
  asChild = false,
}: StyledTooltipProps) {
  // Map variants to icons and tooltip styles
  const iconMap = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle,
    error: XCircle,
    help: HelpCircle,
  };

  // Map variants to colors
  const variantColorMap = {
    info: "text-primary-blue",
    warning: "text-amber-500",
    success: "text-primary-green",
    error: "text-destructive",
    help: "text-primary-blue",
  };

  // Get the appropriate icon based on variant
  const Icon = iconMap[variant];
  const tooltipVariant = variant === "help" ? "info" : variant;

  return (
    <Tooltip>
      <TooltipTrigger asChild={asChild} className={className}>
        {children || (
          <Icon
            className={cn(
              "h-4 w-4", 
              variantColorMap[variant],
              iconClassName
            )}
          />
        )}
      </TooltipTrigger>
      <TooltipContent variant={tooltipVariant} className={contentClassName}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

export default StyledTooltip;
