import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ContactType } from '../generated/prisma/client.js';
import { CreateContactMessageDto } from './dto/create-contact-message.dto.js';
import { ReplyContactMessageDto } from './dto/reply-contact-message.dto.js';

const repliesOrdered = { replies: { orderBy: { createdAt: 'asc' as const } } };

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateContactMessageDto, customerId?: string) {
    return this.prisma.contactMessage.create({ data: { ...dto, customerId } });
  }

  findMine(customerId: string, type?: ContactType) {
    return this.prisma.contactMessage.findMany({
      where: { customerId, type },
      orderBy: { createdAt: 'desc' },
      include: repliesOrdered,
    });
  }

  findAll(type?: ContactType) {
    return this.prisma.contactMessage.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
      include: repliesOrdered,
    });
  }

  // Cliente só pode responder à sua própria conversa — admin pode responder a
  // qualquer uma. É esta verificação que torna seguro o mesmo endpoint servir
  // os dois lados da troca de mensagens.
  async addReply(id: string, dto: ReplyContactMessageDto, authorId: string, isAdmin: boolean) {
    const message = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!message) throw new NotFoundException('Mensagem não encontrada');
    if (!isAdmin && message.customerId !== authorId) {
      throw new ForbiddenException('Esta conversa não é sua');
    }

    await this.prisma.contactReply.create({
      data: { contactMessageId: id, body: dto.reply, fromAdmin: isAdmin },
    });
    if (isAdmin) {
      await this.prisma.contactMessage.update({ where: { id }, data: { status: 'CLOSED' } });
    }

    return this.prisma.contactMessage.findUnique({ where: { id }, include: repliesOrdered });
  }
}
