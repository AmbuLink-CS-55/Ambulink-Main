export class AmbulanceResponseDto {
  id: number;
  plate: string;
  serviceId: number;
  status: string;
  driverId: number | null;
  createdAt: Date | null;
}
