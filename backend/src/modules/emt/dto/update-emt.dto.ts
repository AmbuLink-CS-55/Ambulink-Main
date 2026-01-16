import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateEmtDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  serviceId?: number;

  @IsOptional()
  @IsString()
  phone?: string;
}
