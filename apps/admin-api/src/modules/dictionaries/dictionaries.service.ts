import { Injectable } from '@nestjs/common';
import { buildAdminResourceSnapshot } from '../../common/builders/build-admin-resource-snapshot';

@Injectable()
export class DictionariesService {
  getCollection() {
    return buildAdminResourceSnapshot(
      'dictionaries',
      'Dictionary APIs are scaffolded. Next step: wire dictionaries.v1.json file access and reference checks.',
    );
  }
}