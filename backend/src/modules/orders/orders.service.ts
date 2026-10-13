import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) {}

    //todo...

    
}