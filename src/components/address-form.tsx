"use client";

import type { Address } from "@/lib/api";

export function AddressForm({
  address,
  action,
  onDone,
}: {
  address?: Address;
  action: (formData: FormData) => Promise<void>;
  onDone?: () => void;
}) {
  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone?.();
      }}
      className="grid gap-3 sm:grid-cols-2"
    >
      <input
        name="label"
        defaultValue={address?.label ?? ""}
        placeholder="Nome da morada (ex. Casa, Trabalho)"
        className="input-field w-full sm:col-span-2"
      />
      <input
        required
        name="street"
        defaultValue={address?.street}
        placeholder="Morada"
        className="input-field w-full sm:col-span-2"
      />
      <input required name="streetNumber" defaultValue={address?.streetNumber} placeholder="Número" className="input-field w-full" />
      <input name="floor" defaultValue={address?.floor ?? ""} placeholder="Andar (se aplicável)" className="input-field w-full" />
      <input
        required
        name="postalCode"
        defaultValue={address?.postalCode}
        placeholder="Código postal (0000-000)"
        className="input-field w-full"
      />
      <input required name="city" defaultValue={address?.city} placeholder="Localidade" className="input-field w-full" />
      <input name="phone" defaultValue={address?.phone ?? ""} placeholder="Telemóvel" className="input-field w-full sm:col-span-2" />
      <label className="flex items-center gap-2 text-sm text-muted sm:col-span-2">
        <input type="checkbox" name="isDefault" defaultChecked={address?.isDefault} className="size-4" />
        Definir como morada principal
      </label>
      <button
        type="submit"
        className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 sm:col-span-2"
      >
        {address ? "Guardar alterações" : "Adicionar morada"}
      </button>
    </form>
  );
}
