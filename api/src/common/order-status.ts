import type { OrderStatus } from '../generated/prisma/client.js';

// Estados que significam "o pagamento foi cobrado" — usado sempre que se
// quer contar vendas reais (dashboard, clientes, restock ao cancelar), em
// vez de só o estado literal "PAID", que a encomenda deixa assim que avança
// para preparação/envio.
export const PAID_LIKE_STATUSES: OrderStatus[] = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
