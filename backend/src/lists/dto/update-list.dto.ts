import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ListViewType, SortDirection } from '@prisma/client';

export class UpdateListDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  icon?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  coverImageUrl?: string;

  @IsOptional()
  @IsEnum(ListViewType)
  defaultView?: ListViewType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  defaultSortField?: string;

  @IsOptional()
  @IsEnum(SortDirection)
  defaultSortDir?: SortDirection;
}
