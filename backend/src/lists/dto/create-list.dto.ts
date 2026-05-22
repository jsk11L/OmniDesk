import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ListViewType, SortDirection } from '@prisma/client';

const URL_OR_UPLOAD = /^(?:https?:\/\/|\/uploads\/).+/i;

export class CreateListDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  icon?: string;

  @IsOptional()
  @IsString()
  @Matches(URL_OR_UPLOAD, { message: 'coverImageUrl debe ser una URL o ruta /uploads/...' })
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
