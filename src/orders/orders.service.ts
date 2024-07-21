import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/pagination-order.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  create(createOrderDto: CreateOrderDto) {
    return this.prisma.order.create({
      data: {
        ...createOrderDto,
      },
    });
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const { page, limit, status } = orderPaginationDto;
    const totalPages = await this.prisma.order.count({
      where: { status },
    });
    const currentPage = page;
    const lastPage = Math.ceil(totalPages / limit);
    const data = await this.prisma.order.findMany({
      take: limit,
      skip: (page - 1) * limit,
      where: { status },
    });

    return {
      data,
      currentPage,
      totalPages,
      lastPage,
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findFirst({ where: { id } });
    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }
    return order;
  }
  async changeOrderStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;

    await this.findOne(id);
    return this.prisma.order.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }
}
