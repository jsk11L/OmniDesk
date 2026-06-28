import { IsEnum, IsUUID } from 'class-validator';
import { FavoriteKind } from '@prisma/client';

export class CreateFavoriteDto {
  @IsEnum(FavoriteKind)
  kind!: FavoriteKind;

  @IsUUID()
  entityId!: string;
}
