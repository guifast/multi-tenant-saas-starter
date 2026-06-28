import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary";
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  const tone =
    variant === "primary"
      ? "bg-slate-950 text-white border-slate-950"
      : "bg-white text-slate-950 border-slate-300";
  return (
    <button
      className={`min-h-11 rounded-md border px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-500 ${tone} ${className}`}
      {...props}
    />
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">{children}</div>
  );
}
