import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ContactType } from '../generated/prisma/client.js';
import { CreateContactMessageDto } from './dto/create-contact-message.dto.js';

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
    });
  }

  findAll(type?: ContactType) {
    return this.prisma.contactMessage.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
    });
  }
}
