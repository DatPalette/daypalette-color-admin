import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return an API overview payload', () => {
      expect(appController.getOverview()).toEqual({
        name: 'daypalette-color-admin-api',
        resources: [
          { path: '/api/health', resource: 'health' },
          { path: '/api/dictionaries', resource: 'dictionaries' },
          { path: '/api/base-colors', resource: 'base-colors' },
          { path: '/api/palettes', resource: 'palettes' },
          { path: '/api/collections', resource: 'collections' },
        ],
        status: 'ok',
      });
    });
  });
});
