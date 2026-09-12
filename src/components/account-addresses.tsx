"use client";

import { useState } from "react";
import type { Address } from "@/lib/api";
import { addAddressAction, updateAddressAction, deleteAddressAction } from "@/lib/account-actions";
import { AddressForm } from "@/components/address-form";

export function AccountAddresses({ addresses }: { addresses: Address[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <section className="rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">As minhas moradas</h2>

      {addresses.length === 0 && !adding && <p className="text-sm text-muted">Ainda não tem moradas guardadas.</p>}

      <ul className="space-y-4">
        {addresses.map((address) => (
          <li key={address.id} className="rounded-lg border border-border p-4">
            {editingId === address.id ? (
              <AddressForm
                address={address}
                action={updateAddressAction.bind(null, address.id)}
                onDone={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    {address.label || "Morada"}
                    {address.isDefault && (
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                        Principal
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-muted">
                    {address.street}, {address.streetNumber}
                    {address.floor ? `, ${address.floor}` : ""}
                  </p>
                  <p className="text-muted">
                    {address.postalCode} {address.city}
                  </p>
                  {address.phone && <p className="text-muted">{address.phone}</p>}
                </div>
                <div className="flex shrink-0 gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => setEditingId(address.id)}
                    className="text-muted hover:text-foreground"
                  >
                    Editar
                  </button>
                  <form action={deleteAddressAction.bind(null, address.id)}>
                    <button type="submit" className="text-danger hover:underline">
                      Remover
                    </button>
                  </form>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="mt-4 rounded-lg border border-border p-4">
          <AddressForm action={addAddressAction} onDone={() => setAdding(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-4 text-sm font-medium text-accent hover:underline"
        >
          + Adicionar morada
        </button>
      )}
    </section>
  );
}
