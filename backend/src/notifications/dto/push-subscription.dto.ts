import { Type } from 'class-transformer';
import { IsObject, IsString, IsUrl, ValidateNested } from 'class-validator';

export class PushSubscriptionKeysDto {
  @IsString()
  p256dh!: string;

  @IsString()
  auth!: string;
}

export class PushSubscriptionDto {
  @IsString()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  endpoint!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys!: PushSubscriptionKeysDto;
}

export class UnsubscribePushDto {
  @IsString()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  endpoint!: string;
}
