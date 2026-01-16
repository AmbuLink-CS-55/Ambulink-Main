import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  serviceId: number;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  license: string;
}
