import { Injectable, NotFoundException } from "@nestjs/common";
import { DbService } from "@/common/database/db.service";
import type {
  CreateAmbulanceProviderDto,
  UpdateAmbulanceProviderDto,
} from "@/common/validation/schemas";
import {
  createAmbulanceProvider,
  getAllAmbulanceProviders,
  getAmbulanceProviderById,
  updateAmbulanceProvider,
  deleteAmbulanceProvider,
} from "@/common/queries";

@Injectable()
export class AmbulanceProviderService {
  constructor(private dbService: DbService) {}

  async create(createAmbulanceProviderDto: CreateAmbulanceProviderDto) {
    const result = await createAmbulanceProvider(this.dbService.db, createAmbulanceProviderDto);
    return result[0];
  }

  async findAll() {
    return getAllAmbulanceProviders(this.dbService.db);
  }

  async findOne(id: string) {
    const result = await getAmbulanceProviderById(this.dbService.db, id);
    if (result.length === 0) {
      throw new NotFoundException(`AmbulanceProvider with id ${id} not found`);
    }
    return result[0];
  }

  async update(
    id: string,
    updateAmbulanceProviderDto: UpdateAmbulanceProviderDto
  ) {
    const result = await updateAmbulanceProvider(this.dbService.db, id, updateAmbulanceProviderDto);
    if (result.length === 0) {
      throw new NotFoundException(`AmbulanceProvider with id ${id} not found`);
    }
    return result[0];
  }

  async remove(id: string) {
    await this.findOne(id);
    await deleteAmbulanceProvider(this.dbService.db, id);
  }
}
