import { Body, Controller, Get, Param, Post, Query, Sse } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';
import type { CreateSamplingRunDto } from './dto/create-sampling-run.dto';
import { SamplingRunsService } from './sampling-runs.service';

@Controller('api/sampling-runs')
export class SamplingRunsController {
  constructor(private readonly samplingRunsService: SamplingRunsService) {}

  @Get()
  getCollection(@Query('batchId') batchId?: string) {
    return this.samplingRunsService.getCollection(batchId);
  }

  @Post()
  createRun(@Body() payload: CreateSamplingRunDto) {
    return this.samplingRunsService.createRun(payload);
  }

  @Get(':id')
  getItem(@Param('id') id: string) {
    return this.samplingRunsService.getItem(id);
  }

  @Get(':id/events')
  getEvents(@Param('id') id: string) {
    return this.samplingRunsService.getEvents(id);
  }

  @Sse(':id/stream')
  stream(@Param('id') id: string): Observable<MessageEvent> {
    return this.samplingRunsService.stream(id);
  }
}
