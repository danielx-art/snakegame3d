import { cn } from "../../utils/cn";
import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md";
  block?: boolean; // full-width
};

export default function Button({
  className,
  variant = "ghost",
  block = false,
  ...props
}: ButtonProps) {
  const base =
    "inline-grid place-items-center rounded-md transition-colors select-none outline-none focus-visible:ring-[3px] min-w-fit min-h-fit duration-100 cursor-pointer";
  const variants = {
    primary:
      // neon cyan pill, high contrast text, subtle glow on focus/hover
      "bg-primary text-background hover:bg-primary/90 active:bg-primary/80 " +
      "focus-visible:ring-primary/40 border border-primary/70",
    ghost:
      // transparent with neon hover text/background hint
      "bg-transparent text-text hover:text-primary hover:bg-primary/10 " +
      "focus-visible:ring-primary/30 border border-transparent",
    outline:
      // cyan outline, hover accent
      "bg-transparent text-primary border-2 border-primary/60 hover:border-primary/0 hover:text-background " +
      "hover:bg-primary focus-visible:ring-primary/30",
  };

  return (
    <button
      {...props}
      className={cn(
        base,
        variants[variant],
        block && "w-full",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      <div className="relative w-full h-full grid place-items-center">
        {props.children}
      </div>
    </button>
  );
}