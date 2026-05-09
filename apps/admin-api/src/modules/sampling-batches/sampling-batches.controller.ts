import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import type { GenerateSamplingCandidatesDto } from './dto/generate-sampling-candidates.dto';
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

  @Get('capabilities')
  getCapabilities() {
    return this.samplingBatchesService.getCapabilities();
  }

  @Get(':id')
  getItem(@Param('id') id: string) {
    return this.samplingBatchesService.getItem(id);
  }

  @Post(':id/generate-candidates')
  generateCandidates(
    @Param('id') id: string,
    @Body() payload: GenerateSamplingCandidatesDto = {},
  ) {
    return this.samplingBatchesService.generateCandidates(id, payload);
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
