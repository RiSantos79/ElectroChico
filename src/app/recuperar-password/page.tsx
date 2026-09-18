import { PasswordResetForm } from "@/components/password-reset-form";

export const metadata = {
  title: "Recuperar palavra-passe — ElectroChico",
  // O link chega por email e não deve entrar em motores de busca.
  robots: { index: false, follow: false },
};

export default async function RecuperarPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-6 py-12 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {token ? "Definir nova palavra-passe" : "Recuperar palavra-passe"}
      </h1>
      <PasswordResetForm token={token} />
    </div>
  );
}
