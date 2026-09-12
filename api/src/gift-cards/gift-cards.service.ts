import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class GiftCardsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByCode(code: string) {
    const giftCard = await this.prisma.giftCard.findUnique({ where: { code } });
    if (!giftCard) throw new NotFoundException('Cartão presente não encontrado');
    return giftCard;
  }

  async redeem(code: string, redeemedBy?: string) {
    const giftCard = await this.findByCode(code);
    if (giftCard.status === 'REDEEMED') {
      throw new BadRequestException(
        `Este cartão já foi utilizado em ${giftCard.redeemedAt?.toLocaleString('pt-PT')}.`,
      );
    }
    return this.prisma.giftCard.update({
      where: { code },
      data: { status: 'REDEEMED', redeemedAt: new Date(), redeemedBy },
    });
  }
}
