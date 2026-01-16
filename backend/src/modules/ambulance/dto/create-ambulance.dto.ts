import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateAmbulanceDto {
  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsNumber()
  serviceId: number;

  @IsOptional()
  @IsIn(["available", "in_transit", "unavailable"])
  status?: string;

  @IsOptional()
  @IsNumber()
  driverId?: number;
}
