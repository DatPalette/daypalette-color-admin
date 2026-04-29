import { Injectable } from '@nestjs/common';
import { buildAdminResourceSnapshot } from '../../common/builders/build-admin-resource-snapshot';

@Injectable()
export class CollectionsService {
  getCollection() {
    return buildAdminResourceSnapshot(
      'collections',
      'Collection APIs are scaffolded. Next step: connect cover palette lookup and collection member validation.',
    );
  }
}