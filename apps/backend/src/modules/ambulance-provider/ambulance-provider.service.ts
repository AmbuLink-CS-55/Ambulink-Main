import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  CreateAmbulanceProviderDto,
  UpdateAmbulanceProviderDto,
} from "@/common/validation/schemas";
import { AmbulanceProviderRepository } from "./ambulance-provider.repository";

@Injectable()
export class AmbulanceProviderService {
  constructor(private ambulanceProviderRepository: AmbulanceProviderRepository) {}

  async create(createAmbulanceProviderDto: CreateAmbulanceProviderDto) {
    const result = await this.ambulanceProviderRepository.createAmbulanceProvider(
      createAmbulanceProviderDto
    );
    return result[0];
  }

  async findAll() {
    return this.ambulanceProviderRepository.getAllAmbulanceProviders();
  }

  async findOne(id: string) {
    const result = await this.ambulanceProviderRepository.getAmbulanceProviderById(id);
    if (result.length === 0) {
      throw new NotFoundException(`AmbulanceProvider with id ${id} not found`);
    }
    return result[0];
  }

  async update(id: string, updateAmbulanceProviderDto: UpdateAmbulanceProviderDto) {
    const result = await this.ambulanceProviderRepository.updateAmbulanceProvider(
      id,
      updateAmbulanceProviderDto
    );
    if (result.length === 0) {
      throw new NotFoundException(`AmbulanceProvider with id ${id} not found`);
    }
    return result[0];
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.ambulanceProviderRepository.deleteAmbulanceProvider(id);
  }
}
