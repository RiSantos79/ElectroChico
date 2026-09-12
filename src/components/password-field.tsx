"use client";

import { useState } from "react";

export function PasswordField({
  name,
  placeholder,
  autoComplete,
}: {
  name: string;
  placeholder: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        required
        type={visible ? "text" : "password"}
        name={name}
        minLength={8}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="input-field w-full pr-16"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted hover:text-foreground"
      >
        {visible ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}
