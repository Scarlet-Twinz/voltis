import {
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateWebhookEndpointDto {
  @IsUrl({
    require_tld: false,
  })
  @MaxLength(500)
  url!: string;

  @IsString()
  @MaxLength(255)
  secret!: string;
}
