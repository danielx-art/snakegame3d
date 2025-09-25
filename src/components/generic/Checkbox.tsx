import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "../../utils/cn";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // base box
        "size-4 shrink-0 rounded-[4px] border outline-none shadow-xs transition-shadow",
        // colors
        "bg-transparent border-neutral/60 text-text",
        // focus ring/border
        "focus-visible:ring-[3px] focus-visible:ring-primary/40 focus-visible:border-primary/80",
        // checked state
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-background",
        // invalid (keep subtle)
        "aria-invalid:border-secondary/60 aria-invalid:focus-visible:ring-secondary/30",
        // disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        {/* Checkmark uses currentColor; when checked, text = background for contrast */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="size-3.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 5 5 10-12" />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };