import type { Role } from '../generated/prisma/client.js';

export const MODULES = [
  'dashboard',
  'produtos',
  'categorias',
  'marcas',
  'stock',
  'encomendas',
  'clientes',
  'mensagens',
  'devolucoes',
  'garantias',
  'cupoes',
  'promocoes',
  'relatorios',
  'configuracoes',
  'utilizadores',
  'auditoria',
] as const;
export type Module = (typeof MODULES)[number];

export const ACTIONS = ['view', 'create', 'edit', 'delete', 'export'] as const;
export type Action = (typeof ACTIONS)[number];

export type ModulePermissions = Record<Action, boolean>;
export type PermissionMatrix = Record<Module, ModulePermissions>;

const NONE: ModulePermissions = { view: false, create: false, edit: false, delete: false, export: false };
const FULL: ModulePermissions = { view: true, create: true, edit: true, delete: true, export: true };
const VIEW_ONLY: ModulePermissions = { ...NONE, view: true };
const VIEW_EXPORT: ModulePermissions = { ...NONE, view: true, export: true };
const VIEW_EDIT: ModulePermissions = { ...NONE, view: true, edit: true };

function matrix(overrides: Partial<Record<Module, ModulePermissions>>): PermissionMatrix {
  const result = {} as PermissionMatrix;
  for (const m of MODULES) result[m] = overrides[m] ?? { ...NONE };
  return result;
}

const ALL_MODULES_FULL = matrix(Object.fromEntries(MODULES.map((m) => [m, { ...FULL }])) as Record<Module, ModulePermissions>);

// Mapeamento de negócio para módulos formais: "Homepage/Banners/Landing
// Pages/Newsletter" (Marketing) e "Campanhas" (Manager) não são módulos à
// parte nesta app — caem em "Configurações" e "Promoções" respetivamente.
// "Devoluções"/"Garantias" partilham hoje o mesmo endpoint que "Mensagens"
// (tudo é ContactMessage com tipos diferentes), por isso a aplicação real
// destes três no backend é feita em conjunto, não isolada por módulo.
export const ROLE_DEFAULTS: Record<Role, PermissionMatrix> = {
  SUPER_ADMIN: ALL_MODULES_FULL,

  ADMIN: matrix({
    ...Object.fromEntries(MODULES.map((m) => [m, { ...FULL }])),
    utilizadores: VIEW_ONLY,
  } as Record<Module, ModulePermissions>),

  MANAGER: matrix({
    dashboard: VIEW_ONLY,
    produtos: FULL,
    categorias: FULL,
    marcas: FULL,
    promocoes: FULL,
    encomendas: VIEW_EDIT,
    relatorios: VIEW_ONLY,
  }),

  STOCK_MANAGER: matrix({
    dashboard: VIEW_ONLY,
    stock: FULL,
    produtos: VIEW_ONLY,
  }),

  CUSTOMER_SUPPORT: matrix({
    dashboard: VIEW_ONLY,
    mensagens: { ...NONE, view: true, create: true, edit: true },
    devolucoes: { ...NONE, view: true, create: true, edit: true },
    garantias: { ...NONE, view: true, create: true, edit: true },
    clientes: VIEW_ONLY,
    encomendas: VIEW_ONLY,
  }),

  MARKETING: matrix({
    dashboard: VIEW_ONLY,
    configuracoes: FULL,
    promocoes: FULL,
    cupoes: FULL,
  }),

  FINANCE: matrix({
    dashboard: VIEW_ONLY,
    relatorios: VIEW_EXPORT,
    encomendas: VIEW_ONLY,
  }),

  OPERATOR: matrix({
    dashboard: VIEW_ONLY,
    encomendas: VIEW_EDIT,
  }),

  CUSTOMER: matrix({}),
};

export function effectivePermissions(user: { role: Role; permissionOverrides: unknown }): PermissionMatrix {
  if (user.permissionOverrides && typeof user.permissionOverrides === 'object') {
    return user.permissionOverrides as PermissionMatrix;
  }
  return ROLE_DEFAULTS[user.role];
}

export function hasPermission(user: { role: Role; permissionOverrides: unknown }, module: Module, action: Action): boolean {
  return effectivePermissions(user)[module]?.[action] === true;
}
