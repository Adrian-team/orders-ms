import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/pagination-order.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { PAYMENTS_SERVICE, PRODUCT_SERVICE } from 'src/config/services';
import { firstValueFrom } from 'rxjs';
import { orderWithProducts } from './interfaces/orderWithProducts.interface';
import { PaidOrderDTO } from './dto/paid-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    @Inject(PRODUCT_SERVICE) private readonly productsClient: ClientProxy,
    @Inject(PAYMENTS_SERVICE) private readonly paymentsClient: ClientProxy,
  ) {}

  private async getProductsByIds(ids: number[]) {
    try {
      const products = await firstValueFrom(
        this.productsClient.send({ cmd: 'validate_product' }, ids),
      );
      return products;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: error.message,
      });
    }
  }

  async create(createOrderDto: CreateOrderDto) {
    const ids = createOrderDto.items.map((p) => p.productId);
    const products = await this.getProductsByIds(ids);

    try {
      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const price = products.find(
          (product) => product.id === orderItem.productId,
        ).price;
        acc = acc + price * orderItem.quantity;
        return acc;
      }, 0);

      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);

      const order = await this.prisma.order.create({
        data: {
          totalAmount,
          totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                ...orderItem,
                price: products.find((p) => p.id === orderItem.productId).price,
              })),
            },
          },
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((p) => p.id === orderItem.productId).name,
        })),
      };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
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
    const order = await this.prisma.order.findFirst({
      where: { id },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
    });
    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }

    const products = await this.getProductsByIds(
      order.OrderItem.map((p) => p.productId),
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,
        name: products.find((p) => p.id === orderItem.productId).name,
      })),
    };
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

  async createPaymentSession(order: orderWithProducts) {
    console.log('🚀 ~ order:', order);
    try {
      const paymentSession = await firstValueFrom(
        this.paymentsClient.send('create.payment.session', {
          orderId: order.id,
          currency: 'usd',
          items: order.OrderItem.map((e) => ({
            name: e.name,
            price: e.price,
            quantity: e.quantity,
          })),
        }),
      );
      return paymentSession;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
  }

  async paidOrder(paidOrderDto: PaidOrderDTO) {
    await this.prisma.order.update({
      where: {
        id: paidOrderDto.orderId,
      },
      data: {
        status: 'PAID',
        paid: true,
        paidAt: new Date(),
        stripeChargeId: paidOrderDto.stripePaymentId,
        // relation one to one
        OrderReceipt: {
          create: {
            receiptUrl: paidOrderDto.receipURL,
          },
        },
      },
    });
  }
}
