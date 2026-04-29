import { Injectable } from '@nestjs/common';
import { buildAdminResourceSnapshot } from '../../common/builders/build-admin-resource-snapshot';

@Injectable()
export class PalettesService {
  getCollection() {
    return buildAdminResourceSnapshot(
      'palettes',
      'Palette APIs are scaffolded. Next step: join palette records with base color references and dictionary labels.',
    );
  }
}