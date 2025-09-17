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
  // style overrides
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
      className={className}
      aria-hidden={false}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "grid",
        placeItems: "center",
        ...style,
      }}
    >
      <div
        className={cn(`${backdropClassName} bg-black/0.4 backdrop-blur-xl`)}
        onMouseDown={handleBackdropMouseDown}
        style={{
          position: "fixed",
          inset: 0,
          ...backdropStyle,
        }}
      />
      <div
        ref={containerRef}
        role={role}
        aria-modal="true"
        tabIndex={-1}
        {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
        className={contentClassName}
        style={{
          position: "relative",
          zIndex: 1001,
          overflow: "auto",
          boxShadow:
            "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>,
    portalElRef.current
  );
}
