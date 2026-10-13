import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class LoyaltyService {
    constructor(private prisma: PrismaService) {}

    //todo..

    
}