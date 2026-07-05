import * as React from "react";
import { cn } from "../../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger" | "success";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[#F97316] text-white hover:bg-[#ea580c] shadow-sm": variant === "default",
            "border border-[#E5E7EB] bg-white text-[#111827] hover:bg-slate-50": variant === "outline",
            "hover:bg-[#F97316]/10 text-[#64748B] hover:text-[#F97316]": variant === "ghost",
            "bg-red-500 text-white shadow-sm hover:bg-red-600": variant === "danger",
            "bg-green-500 text-white shadow-sm hover:bg-green-600": variant === "success",
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-10 rounded-md px-8": size === "lg",
            "h-9 w-9": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
