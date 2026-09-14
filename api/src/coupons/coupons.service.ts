import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { UpdateCouponDto } from './dto/update-coupon.dto.js';
import type { ApplyCouponDto } from './dto/apply-coupon.dto.js';
import type { Coupon } from '../generated/prisma/client.js';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateCouponDto) {
    const code = dto.code.trim().toUpperCase();
    if (await this.prisma.coupon.findUnique({ where: { code } })) {
      throw new ConflictException(`Já existe um cupão com o código "${code}"`);
    }
    return this.prisma.coupon.create({ data: { ...dto, code } });
  }

  async update(id: string, dto: UpdateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Cupão com id "${id}" não encontrado`);

    const code = dto.code ? dto.code.trim().toUpperCase() : undefined;
    if (code && code !== existing.code && (await this.prisma.coupon.findUnique({ where: { code } }))) {
      throw new ConflictException(`Já existe um cupão com o código "${code}"`);
    }
    return this.prisma.coupon.update({ where: { id }, data: { ...dto, code } });
  }

  async remove(id: string) {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Cupão com id "${id}" não encontrado`);
    await this.prisma.coupon.delete({ where: { id } });
  }

  // Recalcula o subtotal a partir dos preços reais na base de dados — nunca
  // confia num valor vindo do browser.
  async computeSubtotal(items: { productId: string; quantity: number }[]): Promise<number> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
    });
    return items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new BadRequestException(`Produto "${item.productId}" não encontrado`);
      return sum + Number(product.price) * item.quantity;
    }, 0);
  }

  async validateAndCompute(rawCode: string, subtotal: number): Promise<{ coupon: Coupon; discountAmount: number }> {
    const code = rawCode.trim().toUpperCase();
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });
    if (!coupon) throw new BadRequestException('Código de desconto inválido.');
    if (!coupon.active) throw new BadRequestException('Este código de desconto já não está ativo.');

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      throw new BadRequestException('Este código de desconto ainda não é válido.');
    }
    if (coupon.validUntil && now > coupon.validUntil) {
      throw new BadRequestException('Este código de desconto já expirou.');
    }
    if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
      throw new BadRequestException('Este código de desconto atingiu o limite de utilizações.');
    }
    if (coupon.minOrderValue !== null && subtotal < Number(coupon.minOrderValue)) {
      throw new BadRequestException(
        `Este código de desconto exige uma compra mínima de ${Number(coupon.minOrderValue).toFixed(2)}€.`,
      );
    }

    const rawDiscount =
      coupon.type === 'PERCENTAGE' ? subtotal * (Number(coupon.value) / 100) : Number(coupon.value);
    const discountAmount = Math.min(rawDiscount, subtotal);

    return { coupon, discountAmount };
  }

  async apply(dto: ApplyCouponDto) {
    const subtotal = await this.computeSubtotal(dto.items);
    const { discountAmount } = await this.validateAndCompute(dto.code, subtotal);
    return { subtotal, discountAmount, total: subtotal - discountAmount };
  }
}
