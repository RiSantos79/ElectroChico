import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SiteSettings } from '../generated/prisma/client.js';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto.js';

const SINGLETON_ID = 'singleton';

// Valores usados enquanto o admin não configurar nada — os mesmos textos que
// estavam fixos no rodapé antes deste ecrã existir, para a loja nunca mostrar
// espaços em branco.
const DEFAULTS = {
  trustBadge1Title: 'Entregas rápidas',
  trustBadge1Desc: 'Em 24-48h em todo o país',
  trustBadge2Title: 'Pagamentos seguros',
  trustBadge2Desc: 'MB Way, Multibanco, cartão e PayPal',
  trustBadge3Title: 'Apoio ao cliente',
  trustBadge3Desc: 'Suporte dedicado 7 dias por semana',
  trustBadge4Title: 'Garantia oficial',
  trustBadge4Desc: 'Garantia do fabricante em todos os produtos',
  copyrightText: `© ${new Date().getFullYear()} ElectroChico. Todos os direitos reservados.`,
};

// Preenche cada campo em falta com o valor por omissão, em vez de um simples
// spread — um campo NULL na base de dados (nunca editado) tinha de perder
// para o default, não substituí-lo por vazio.
function withDefaults(settings: SiteSettings | null) {
  const merged = { ...DEFAULTS } as Record<string, string | null>;
  for (const [key, value] of Object.entries(settings ?? {})) {
    if (value !== null && value !== undefined && key !== 'id' && key !== 'updatedAt') merged[key] = value as string;
  }
  return merged;
}

@Injectable()
export class SiteSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const settings = await this.prisma.siteSettings.findUnique({ where: { id: SINGLETON_ID } });
    return withDefaults(settings);
  }

  async update(dto: UpdateSiteSettingsDto) {
    const settings = await this.prisma.siteSettings.upsert({
      where: { id: SINGLETON_ID },
      update: dto,
      create: { id: SINGLETON_ID, ...dto },
    });
    return withDefaults(settings);
  }
}
