import { HTMLAttributes, LabelHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }>(
  ({ className, required, children, ...props }, ref) => (
    <label ref={ref} className={cn("mb-1.5 block text-sm font-medium text-foreground", className)} {...props}>
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  ),
);
Label.displayName = "Label";

export const FieldError = ({ children }: { children?: React.ReactNode }) =>
  children ? <p className="mt-1 text-xs text-red-500">{children}</p> : null;

export const HelpText = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-1 text-xs text-muted-foreground">{children}</p>
);

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "secondary" | "primary";
const BADGE_CLS: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-800",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  destructive: "bg-red-100 text-red-800",
  secondary: "bg-slate-100 text-slate-700",
  primary: "bg-blue-100 text-blue-800",
};
export function Badge({ variant = "default", children, className }: {
  variant?: BadgeVariant; children: React.ReactNode; className?: string;
}) {
  return (
    <span className={cn(
      "inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
      BADGE_CLS[variant], className,
    )}>{children}</span>
  );
}

type AlertVariant = "info" | "success" | "warning" | "danger";
const ALERT_CLS: Record<AlertVariant, string> = {
  info:    "border-blue-400 bg-blue-50 text-blue-900",
  success: "border-emerald-400 bg-emerald-50 text-emerald-900",
  warning: "border-amber-400 bg-amber-50 text-amber-900",
  danger:  "border-red-400 bg-red-50 text-red-900",
};
export function Alert({ variant = "info", children, className }: {
  variant?: AlertVariant; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn(
      "rounded-md border-l-4 p-3 text-sm",
      ALERT_CLS[variant], className,
    )}>{children}</div>
  );
}

export function PageTitle({ title, subtitle, children }: {
  title: string; subtitle?: string; children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="py-10 text-center text-sm text-muted-foreground">{children}</div>;
}
