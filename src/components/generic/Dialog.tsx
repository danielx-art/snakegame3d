import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap, useLockBodyScroll } from "../../utils/dialogHooks";
import { cn } from "../../utils/cn";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  backdropClassName?: string;
  contentClassName?: string;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  lockScroll?: boolean;
  ariaLabel?: string;
  role?: "dialog" | "alertdialog";
  style?: React.CSSProperties;
  backdropStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
};

export function Dialog({
  open,
  onClose,
  children,
  className,
  backdropClassName,
  contentClassName,
  closeOnBackdrop = true,
  closeOnEsc = true,
  lockScroll = true,
  ariaLabel,
  role = "dialog",
  style,
  backdropStyle,
  contentStyle,
}: DialogProps) {
  const containerRef = useFocusTrap(open);
  const portalElRef = useRef<HTMLElement | null>(null);

  useLockBodyScroll(open && lockScroll);

  // Create/find portal root
  useEffect(() => {
    let el = document.getElementById("dialog-root") as HTMLElement | null;
    if (!el) {
      el = document.createElement("div");
      el.id = "dialog-root";
      document.body.appendChild(el);
    }
    portalElRef.current = el;
  }, []);

  // Escape to close
  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, { capture: true });
    return () => document.removeEventListener("keydown", onKey, { capture: true });
  }, [open, closeOnEsc, onClose]);

  if (!open || !portalElRef.current) return null;

  const handleBackdropMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 grid place-items-center",
        "z-[100]",
        className
      )}
      aria-hidden={false}
      style={{
        ...style,
      }}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0",
          "bg-background/80",
          "ring-1 ring-primary/10",
          backdropClassName
        )}
        onMouseDown={handleBackdropMouseDown}
        style={backdropStyle}
      />

      {/* Content */}
      <div
        ref={containerRef}
        role={role}
        aria-modal="true"
        tabIndex={-1}
        {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
        className={cn(
          "relative rounded-md",
          "bg-background text-text border border-accent/40",
          "shadow-[0_10px_25px_rgba(0,0,0,0.35)]",
          "ring-1 ring-primary/10",
          "outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          "z-[110]",
          contentClassName
        )}
        style={{
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>,
    portalElRef.current
  );
}