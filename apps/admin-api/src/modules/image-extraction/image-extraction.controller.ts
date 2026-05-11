import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ImageExtractionService } from './image-extraction.service';
import type { ExtractImageColorsDto } from './dto/extract-image-colors.dto';

interface MulterFile {
  buffer: Buffer
  mimetype: string
  originalname: string
  size: number
}

@Controller('api/image-extraction')
export class ImageExtractionController {
  constructor(
    private readonly imageExtractionService: ImageExtractionService,
  ) {}

  @Post('from-urls')
  async extractFromUrls(@Body() body: ExtractImageColorsDto & { imageUrls: string[] }) {
    if (!body.imageUrls || body.imageUrls.length === 0) {
      throw new BadRequestException('imageUrls is required and must not be empty.');
    }

    if (!body.occasionId || !body.themeKey || !body.themeLabelZh) {
      throw new BadRequestException('occasionId, themeKey, and themeLabelZh are required.');
    }

    return this.imageExtractionService.extractFromUrls(body.imageUrls, body);
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 20))
  async extractFromUpload(
    @UploadedFiles() files: MulterFile[],
    @Body() body: Omit<ExtractImageColorsDto, 'imageUrls'>,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image file is required.');
    }

    if (!body.occasionId || !body.themeKey || !body.themeLabelZh) {
      throw new BadRequestException('occasionId, themeKey, and themeLabelZh are required.');
    }

    const buffers = files.map((file) => file.buffer)
    return this.imageExtractionService.extractFromBuffers(buffers, body as ExtractImageColorsDto);
  }
}
