import { IsIn, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateAmbulanceDto {
  @IsOptional()
  @IsString()
  plate?: string;

  @IsOptional()
  @IsNumber()
  serviceId?: number;

  @IsOptional()
  @IsIn(["available", "in_transit", "unavailable"])
  status?: string;

  @IsOptional()
  @IsNumber()
  driverId?: number;
}
