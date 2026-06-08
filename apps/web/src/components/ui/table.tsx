import { cn } from "@/lib/utils";
import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, forwardRef } from "react";

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-auto rounded-md">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  ),
);
Table.displayName = "Table";

export const THead = ({ children, className }: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("bg-slate-50 text-slate-600", className)}>{children}</thead>
);

export const TBody = ({ children, className }: HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("divide-y", className)}>{children}</tbody>
);

export const TR = ({ children, className }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("transition-colors hover:bg-slate-50", className)}>{children}</tr>
);

export const TH = ({ children, className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600",
      className,
    )}
    {...props}
  >
    {children}
  </th>
);

export const TD = ({ children, className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("px-4 py-3 text-sm text-slate-800", className)} {...props}>
    {children}
  </td>
);
