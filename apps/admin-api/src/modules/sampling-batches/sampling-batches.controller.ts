import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
} from '@nestjs/common';
import type { UpsertSamplingBatchDto } from './dto/upsert-sampling-batch.dto';
import type { UpdateSamplingBatchStatusDto } from './dto/update-sampling-batch-status.dto';
import { SamplingBatchesService } from './sampling-batches.service';

@Controller('api/sampling-batches')
export class SamplingBatchesController {
  constructor(
    private readonly samplingBatchesService: SamplingBatchesService,
  ) {}

  @Get()
  getCollection() {
    return this.samplingBatchesService.getCollection();
  }

  @Get(':id')
  getItem(@Param('id') id: string) {
    return this.samplingBatchesService.getItem(id);
  }

  @Put(':id')
  upsertItem(@Param('id') id: string, @Body() payload: UpsertSamplingBatchDto) {
    return this.samplingBatchesService.upsertItem(id, payload);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() payload: UpdateSamplingBatchStatusDto,
  ) {
    return this.samplingBatchesService.updateStatus(id, payload.status);
  }

  @Delete(':id')
  deleteItem(@Param('id') id: string) {
    return this.samplingBatchesService.deleteItem(id);
  }
}
