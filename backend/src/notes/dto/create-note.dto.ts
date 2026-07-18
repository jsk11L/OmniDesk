import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const URL_OR_UPLOAD = /^(?:https?:\/\/|\/uploads\/).+/i;

export class CreateNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1_000_000)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  icon?: string;

  @IsOptional()
  @IsString()
  @Matches(URL_OR_UPLOAD, { message: 'coverImageUrl must be a URL or an /uploads/ path' })
  coverImageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  /** Anchor this note to an element (hidden from the main notes list). */
  @IsOptional()
  @IsIn(['event', 'list-item'])
  anchorType?: 'event' | 'list-item';

  @IsOptional()
  @IsUUID()
  anchorId?: string;
}
