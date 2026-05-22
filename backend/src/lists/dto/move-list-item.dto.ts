import { IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * Move a list item from its source list to a target list.
 *
 * The service preserves the title (overridable via `title`) and remaps customFields
 * from source-field-name → target-field-id when a field with the same name exists
 * in the destination. Anything in `customFieldsPatch` is merged on top of the
 * remapped fields, so callers can use this to fill "completion" data (e.g. year,
 * month, computed index) when promoting an item from Backlog to Completed.
 */
export class MoveListItemDto {
  @IsUUID()
  targetListId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsObject()
  customFieldsPatch?: Record<string, unknown>;
}
