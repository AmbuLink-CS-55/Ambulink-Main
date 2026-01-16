import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateEmtDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  serviceId: number;

  @IsString()
  @IsNotEmpty()
  phone: string;
}
