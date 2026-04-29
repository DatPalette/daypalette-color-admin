import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getStatus() {
    return {
      service: 'admin-api',
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
    };
  }
}