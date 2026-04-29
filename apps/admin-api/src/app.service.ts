import { Injectable } from '@nestjs/common';
import { type AdminApiOverview } from './common/types/admin-payload.types';

@Injectable()
export class AppService {
  getOverview(): AdminApiOverview {
    return {
      name: 'daypalette-color-admin-api',
      resources: [
        { path: '/api/health', resource: 'health' },
        { path: '/api/dictionaries', resource: 'dictionaries' },
        { path: '/api/base-colors', resource: 'base-colors' },
        { path: '/api/palettes', resource: 'palettes' },
        { path: '/api/collections', resource: 'collections' },
      ],
      status: 'ok',
    };
  }
}
