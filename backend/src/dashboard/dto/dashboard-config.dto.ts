import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsString, MaxLength, ValidateNested } from 'class-validator';

export class DashboardWidgetPrefDto {
  @IsString()
  @MaxLength(64)
  id!: string;

  @IsBoolean()
  visible!: boolean;
}

export class DashboardConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DashboardWidgetPrefDto)
  widgets!: DashboardWidgetPrefDto[];
}
