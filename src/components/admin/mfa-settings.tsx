"use client";

import { useState, useTransition } from "react";
import { confirmMfaSetupAction, disableMfaAction, startMfaSetupAction } from "@/lib/mfa-actions";

type View =
  | { type: "status" }
  | { type: "setup"; secret: string; otpauthUrl: string; qrDataUrl: string }
  | { type: "recovery-codes"; codes: string[] };

export function MfaSettings({ initiallyEnabled }: { initiallyEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [view, setView] = useState<View>({ type: "status" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleStartSetup() {
    setError(null);
    startTransition(async () => {
      const result = await startMfaSetupAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setView({ type: "setup", secret: result.secret, otpauthUrl: result.otpauthUrl, qrDataUrl: result.qrDataUrl });
    });
  }

  function handleConfirm(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const code = String(formData.get("code") ?? "");
      const result = await confirmMfaSetupAction(code);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setView({ type: "recovery-codes", codes: result.recoveryCodes });
      setEnabled(true);
    });
  }

  function handleDisable(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const password = String(formData.get("password") ?? "");
      const result = await disableMfaAction(password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEnabled(false);
      setView({ type: "status" });
    });
  }

  if (view.type === "recovery-codes") {
    return (
      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          Verificação em duas etapas ativada
        </h2>
        <p className="mb-4 text-sm text-danger">
          Guarde estes códigos de recuperação num local seguro — cada um só pode ser usado uma vez, e não
          voltarão a ser mostrados. Servem para entrar caso perca o acesso à app de autenticação.
        </p>
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface p-4 font-mono text-sm">
          {view.codes.map((code) => (
            <span key={code}>{code}</span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setView({ type: "status" })}
          className="mt-4 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          Já guardei os códigos
        </button>
      </section>
    );
  }

  if (view.type === "setup") {
    return (
      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Configurar verificação em duas etapas</h2>
        <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Digitalize o código com uma app de autenticação (Google Authenticator, Authy, etc.).</li>
          <li>
            Ou introduza manualmente esta chave: <code className="text-foreground">{view.secret}</code>
          </li>
          <li>Introduza abaixo o código de 6 dígitos gerado pela app para confirmar.</li>
        </ol>
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL gerado no servidor, não vale a pena otimizar */}
        <img src={view.qrDataUrl} alt="Código QR para configurar a app de autenticação" className="mb-4 size-48" />
        <form action={handleConfirm} className="flex max-w-xs gap-2">
          <input name="code" required autoFocus placeholder="123456" className="input-field flex-1" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            Confirmar
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="mb-2 text-lg font-semibold text-foreground">Verificação em duas etapas</h2>
      <p className="mb-4 text-sm text-muted">
        {enabled
          ? "Ativa — ao iniciar sessão, é sempre pedido um código além da palavra-passe."
          : "Inativa — a conta só está protegida pela palavra-passe."}
      </p>

      {enabled ? (
        <form action={handleDisable} className="flex max-w-xs flex-col gap-2">
          <input name="password" type="password" required placeholder="Palavra-passe atual" className="input-field" />
          <button
            type="submit"
            disabled={pending}
            className="self-start rounded-full border border-danger px-5 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10 disabled:opacity-50"
          >
            Desativar
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={handleStartSetup}
          disabled={pending}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          Ativar verificação em duas etapas
        </button>
      )}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </section>
  );
}
