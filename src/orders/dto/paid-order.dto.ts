import { IsString, IsUUID, IsUrl } from 'class-validator';

export class PaidOrderDTO {
  @IsString()
  stripePaymentId: string;
  @IsString()
  @IsUUID()
  orderId: string;
  @IsString()
  @IsUrl()
  receipURL: string;
}
