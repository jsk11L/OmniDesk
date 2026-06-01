import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const URL_OR_UPLOAD = /^(?:https?:\/\/|\/uploads\/).+/i;

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Matches(URL_OR_UPLOAD, { message: 'avatarUrl must be a URL or an /uploads/ path' })
  avatarUrl?: string;
}
