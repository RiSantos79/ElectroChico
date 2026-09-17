import { getSiteSettings } from "@/lib/api";

export async function Footer() {
  const settings = await getSiteSettings().catch(() => ({}) as Awaited<ReturnType<typeof getSiteSettings>>);

  const trustItems = [
    { title: settings.trustBadge1Title, desc: settings.trustBadge1Desc },
    { title: settings.trustBadge2Title, desc: settings.trustBadge2Desc },
    { title: settings.trustBadge3Title, desc: settings.trustBadge3Desc },
    { title: settings.trustBadge4Title, desc: settings.trustBadge4Desc },
  ].filter((item): item is { title: string; desc: string } => Boolean(item.title));

  const hasCompanyInfo = settings.companyName || settings.taxId || settings.address || settings.phone;
  const hasSocial = settings.facebookUrl || settings.instagramUrl;

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="grid grid-cols-2 gap-6 px-6 py-10 sm:grid-cols-4 lg:px-10">
        {trustItems.map((item) => (
          <div key={item.title}>
            <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
            <p className="mt-1 text-sm text-muted">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="flex flex-col gap-2 px-6 py-6 text-sm text-muted lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="space-y-1">
            {settings.copyrightText && <p>{settings.copyrightText}</p>}
            {hasCompanyInfo && (
              <p className="text-xs">
                {[settings.companyName, settings.taxId && `NIF ${settings.taxId}`, settings.address]
                  .filter(Boolean)
                  .join(" · ")}
                {settings.phone && ` · Tel. ${settings.phone}`}
              </p>
            )}
          </div>
          {hasSocial && (
            <div className="flex gap-4 text-xs">
              {settings.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                  Facebook
                </a>
              )}
              {settings.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                  Instagram
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
