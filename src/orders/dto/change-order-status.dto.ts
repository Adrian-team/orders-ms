import { OrderStatus } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';
import { OrderStatusList } from '../enum/order.enum';

export class ChangeOrderStatusDto {
  @IsString()
  id: string;

  @IsEnum(OrderStatusList, {
    message: `Possible status value ${OrderStatusList}`,
  })
  status: OrderStatus;
}
