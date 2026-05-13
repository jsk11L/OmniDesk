import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReorderItemEntryDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  columnId!: string;

  @IsInt()
  @Min(0)
  position!: number;
}

export class ReorderItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemEntryDto)
  items!: ReorderItemEntryDto[];
}
