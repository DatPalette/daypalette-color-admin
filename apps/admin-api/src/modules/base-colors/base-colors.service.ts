import { Injectable } from '@nestjs/common';
import { buildAdminResourceSnapshot } from '../../common/builders/build-admin-resource-snapshot';

@Injectable()
export class BaseColorsService {
  getCollection() {
    return buildAdminResourceSnapshot(
      'base-colors',
      'Base color APIs are scaffolded. Next step: read base-colors.v1.json and apply soft-delete filtering.',
    );
  }
}