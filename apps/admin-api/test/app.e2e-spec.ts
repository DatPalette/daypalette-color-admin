import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import type {
  BaseColorDeleteCheckResult,
  BaseColorRecord,
  CollectionDeleteCheckResult,
  CollectionRecord,
  DictionariesDocument,
  DictionaryItemDeleteCheckResult,
  DictionaryNode,
  PaletteDataCollectionDocument,
  PaletteDeleteCheckResult,
  PaletteRecord,
} from './../src/common/types/palette-data.types';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let previousDayPaletteRoot: string | undefined;
  let temporaryDayPaletteRoot: string;

  type BaseColorCollectionDocument =
    PaletteDataCollectionDocument<BaseColorRecord>;
  type CollectionCollectionDocument =
    PaletteDataCollectionDocument<CollectionRecord>;
  type PaletteCollectionDocument = PaletteDataCollectionDocument<PaletteRecord>;
  type DeleteBlockedResponse<TDeleteCheck> = {
    deleteCheck: TDeleteCheck;
    message: string;
  };
  type MessageResponse = {
    message: string;
  };

  function expectBody<TBody>(
    assertion: (body: TBody) => void,
  ): (response: { body: unknown }) => void {
    return (response) => {
      assertion(response.body as TBody);
    };
  }

  function getResponseBody<TBody>(response: { body: unknown }): TBody {
    return response.body as TBody;
  }

  function requireValue<TValue>(
    value: TValue,
    message: string,
  ): NonNullable<TValue> {
    if (value == null) {
      throw new Error(message);
    }

    return value;
  }

  function getDictionary(
    document: DictionariesDocument,
    key: string,
  ): DictionaryNode {
    return requireValue(
      document.dictionaries[key],
      `Expected ${key} dictionary.`,
    );
  }

  function getItemById<TItem extends { id: string }>(
    items: TItem[],
    id: string,
    message: string,
  ): TItem {
    const item = items.find((currentItem) => currentItem.id === id);

    return requireValue(item, message);
  }

  function getFirstItem<TItem>(items: TItem[], message: string): TItem {
    return requireValue(items[0], message);
  }

  async function readJsonFile<TDocument>(filePath: string): Promise<TDocument> {
    return JSON.parse(await readFile(filePath, 'utf8')) as TDocument;
  }

  function getTempPaletteDataFilePath(fileName: string): string {
    return path.join(
      temporaryDayPaletteRoot,
      'entry/src/main/resources/rawfile/palette-data',
      fileName,
    );
  }

  async function appendUnreferencedBaseColor(): Promise<void> {
    const filePath = getTempPaletteDataFilePath('base-colors.v1.json');
    const document = JSON.parse(await readFile(filePath, 'utf8')) as {
      items: Array<Record<string, unknown>>;
      updatedAt: string;
      version: number;
    };

    document.items.push({
      colorFamily: 'blue',
      hex: '#1234AB',
      id: 'bc_test_delete',
      isNeutralCore: false,
      lightnessLevel: 'mid',
      nameEn: 'Delete Test Blue',
      nameZh: '删除测试蓝',
      occasionTags: ['weekend'],
      saturationLevel: 'mid',
      seasonTags: ['all'],
      status: 'approved',
      styleTags: ['clean'],
      tone: 'cool',
    });
    document.updatedAt = '2026-04-30T00:00:00Z';

    await writeFile(filePath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  }

  async function appendDeletedBaseColor(): Promise<void> {
    const filePath = getTempPaletteDataFilePath('base-colors.v1.json');
    const document = JSON.parse(await readFile(filePath, 'utf8')) as {
      items: Array<Record<string, unknown>>;
      updatedAt: string;
      version: number;
    };

    document.items.push({
      colorFamily: 'green',
      deleteReason: 'archived for restore coverage',
      deletedAt: '2026-04-28T00:00:00Z',
      hex: '#0A9F65',
      id: 'bc_test_restore',
      isNeutralCore: false,
      lightnessLevel: 'mid',
      nameEn: 'Restore Test Green',
      nameZh: '恢复测试绿',
      occasionTags: ['workday'],
      previousStatus: 'approved',
      saturationLevel: 'mid',
      seasonTags: ['spring'],
      status: 'deleted',
      styleTags: ['clean'],
      tone: 'warm',
    });
    document.updatedAt = '2026-04-30T00:00:00Z';

    await writeFile(filePath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  }

  async function appendUnreferencedPalette(): Promise<void> {
    const filePath = getTempPaletteDataFilePath('palettes.v1.json');
    const document = JSON.parse(await readFile(filePath, 'utf8')) as {
      items: Array<Record<string, unknown>>;
      updatedAt: string;
      version: number;
    };

    document.items.push({
      accentColorId: 'bc_0001',
      fitPhotoScenario: false,
      id: 'p_test_delete',
      isPro: false,
      moodTags: ['calm'],
      occasionId: 'workday',
      primaryColorId: 'bc_0002',
      safetyLevel: 'safe',
      seasonTags: ['all'],
      secondaryColorId: 'bc_0003',
      slug: 'palette-delete-test',
      sourceCollectionIds: [],
      sourceType: 'curated',
      status: 'approved',
      styleTags: ['clean'],
    });
    document.updatedAt = '2026-04-30T00:00:00Z';

    await writeFile(filePath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  }

  async function appendDeletedPalette(): Promise<void> {
    const filePath = getTempPaletteDataFilePath('palettes.v1.json');
    const document = JSON.parse(await readFile(filePath, 'utf8')) as {
      items: Array<Record<string, unknown>>;
      updatedAt: string;
      version: number;
    };

    document.items.push({
      accentColorId: 'bc_0001',
      deleteReason: 'archived for restore coverage',
      deletedAt: '2026-04-28T00:00:00Z',
      fitPhotoScenario: false,
      id: 'p_test_restore',
      isPro: false,
      moodTags: ['calm'],
      occasionId: 'workday',
      previousStatus: 'approved',
      primaryColorId: 'bc_0002',
      safetyLevel: 'safe',
      seasonTags: ['all'],
      secondaryColorId: 'bc_0003',
      slug: 'palette-restore-test',
      sourceCollectionIds: [],
      sourceType: 'curated',
      status: 'deleted',
      styleTags: ['clean'],
    });
    document.updatedAt = '2026-04-30T00:00:00Z';

    await writeFile(filePath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  }

  async function appendUnreferencedCollection(): Promise<void> {
    const filePath = getTempPaletteDataFilePath('collections.v1.json');
    const document = JSON.parse(await readFile(filePath, 'utf8')) as {
      items: Array<Record<string, unknown>>;
      updatedAt: string;
      version: number;
    };

    document.items.push({
      coverPaletteId: 'w1',
      descriptionEn: 'Unreferenced collection for delete coverage.',
      descriptionZh: '用于删除覆盖的未引用合集。',
      id: 'col_test_delete',
      isPro: false,
      nameEn: 'Delete Collection',
      nameZh: '删除合集',
      occasionTags: ['workday'],
      paletteIds: ['w1', 'w2'],
      releaseMode: 'permanent',
      status: 'ready',
      styleTags: ['urban'],
      themeType: 'scene',
    });
    document.updatedAt = '2026-04-30T00:00:00Z';

    await writeFile(filePath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  }

  async function appendDeletedCollection(): Promise<void> {
    const filePath = getTempPaletteDataFilePath('collections.v1.json');
    const document = JSON.parse(await readFile(filePath, 'utf8')) as {
      items: Array<Record<string, unknown>>;
      updatedAt: string;
      version: number;
    };

    document.items.push({
      coverPaletteId: 'w1',
      deleteReason: 'archived for restore coverage',
      deletedAt: '2026-04-28T00:00:00Z',
      descriptionEn: 'Deleted collection for restore coverage.',
      descriptionZh: '用于恢复覆盖的已删除合集。',
      id: 'col_test_restore',
      isPro: false,
      nameEn: 'Restore Collection',
      nameZh: '恢复合集',
      occasionTags: ['workday'],
      paletteIds: ['w1', 'w2'],
      previousStatus: 'published',
      releaseMode: 'permanent',
      status: 'deleted',
      styleTags: ['urban'],
      themeType: 'scene',
    });
    document.updatedAt = '2026-04-30T00:00:00Z';

    await writeFile(filePath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  }

  async function appendUnreferencedDictionaryItem(): Promise<void> {
    const filePath = getTempPaletteDataFilePath('dictionaries.v1.json');
    const document = JSON.parse(
      await readFile(filePath, 'utf8'),
    ) as DictionariesDocument;

    getDictionary(document, 'occasion').items.push({
      aliases: [],
      deleteReason: '',
      deletedAt: '',
      descriptionEn: 'Unused item for e2e delete coverage.',
      descriptionZh: '用于 e2e 删除覆盖的未引用字典项。',
      id: 'e2e_unused_occasion',
      isActive: true,
      isDeleted: false,
      labelEn: 'Unused Occasion',
      labelZh: '未引用场合',
      sortOrder: 9900,
    });
    document.updatedAt = '2026-04-30T00:00:00Z';

    await writeFile(filePath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  }

  async function appendDeletedDictionaryItem(): Promise<void> {
    const filePath = getTempPaletteDataFilePath('dictionaries.v1.json');
    const document = JSON.parse(
      await readFile(filePath, 'utf8'),
    ) as DictionariesDocument;

    getDictionary(document, 'occasion').items.push({
      aliases: [],
      deleteReason: 'archived for restore coverage',
      deletedAt: '2026-04-28T00:00:00Z',
      descriptionEn: 'Deleted item for restore coverage.',
      descriptionZh: '用于恢复覆盖的已删除字典项。',
      id: 'e2e_restore_occasion',
      isActive: false,
      isDeleted: true,
      labelEn: 'Restore Occasion',
      labelZh: '恢复场合',
      sortOrder: 9950,
    });
    document.updatedAt = '2026-04-30T00:00:00Z';

    await writeFile(filePath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  }

  beforeEach(async () => {
    previousDayPaletteRoot = process.env.DAY_PALETTE_ROOT;
    temporaryDayPaletteRoot = await mkdtemp(
      path.join(os.tmpdir(), 'daypalette-color-admin-'),
    );

    const sourcePaletteDataRoot = path.resolve(
      process.cwd(),
      '../../../day_palette/entry/src/main/resources/rawfile/palette-data',
    );
    const targetPaletteDataRoot = path.join(
      temporaryDayPaletteRoot,
      'entry/src/main/resources/rawfile/palette-data',
    );

    await mkdir(path.dirname(targetPaletteDataRoot), { recursive: true });
    await cp(sourcePaletteDataRoot, targetPaletteDataRoot, { recursive: true });

    process.env.DAY_PALETTE_ROOT = temporaryDayPaletteRoot;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({
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

  it('/api/dictionaries (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/dictionaries')
      .expect(200)
      .expect(
        expectBody<DictionariesDocument>((body) => {
          const occasionDictionary = getDictionary(body, 'occasion');
          const statusDictionary = getDictionary(body, 'status');

          expect(body.version).toBe(1);
          expect(
            occasionDictionary.items.some((item) => item.id === 'workday'),
          ).toBe(true);
          expect(
            statusDictionary.items.some((item) => item.id === 'deleted'),
          ).toBe(true);
        }),
      );
  });

  it('/api/dictionaries (GET) includes deleted items when requested', async () => {
    await appendDeletedDictionaryItem();

    await request(app.getHttpServer())
      .get('/api/dictionaries?includeDeleted=true')
      .expect(200)
      .expect(
        expectBody<DictionariesDocument>((body) => {
          const occasionDictionary = getDictionary(body, 'occasion');
          const restoredItem = getItemById(
            occasionDictionary.items,
            'e2e_restore_occasion',
            'Expected restored dictionary item.',
          );

          expect(restoredItem.isDeleted).toBe(true);
        }),
      );
  });

  it('/api/dictionaries/:key/items (POST)', async () => {
    const payload = {
      aliases: ['after-work'],
      descriptionEn: 'Created in e2e coverage.',
      descriptionZh: '用于 e2e 新增覆盖。',
      id: 'e2e_created_occasion',
      isActive: true,
      labelEn: 'Created Occasion',
      labelZh: '新增场合',
      sortOrder: 9960,
    };

    await request(app.getHttpServer())
      .post('/api/dictionaries/occasion/items')
      .send(payload)
      .expect(201)
      .expect(
        expectBody<DictionariesDocument>((body) => {
          const occasionDictionary = getDictionary(body, 'occasion');

          expect(
            occasionDictionary.items.some(
              (item) => item.id === 'e2e_created_occasion',
            ),
          ).toBe(true);
        }),
      );

    const fileDocument = await readJsonFile<DictionariesDocument>(
      getTempPaletteDataFilePath('dictionaries.v1.json'),
    );
    const createdItem = getItemById(
      getDictionary(fileDocument, 'occasion').items,
      'e2e_created_occasion',
      'Expected created dictionary item in file.',
    );

    expect(createdItem.labelZh).toBe('新增场合');
    expect(createdItem.isDeleted).toBe(false);
  });

  it('/api/palettes (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/palettes')
      .expect(200)
      .expect(
        expectBody<PaletteCollectionDocument>((body) => {
          const firstPalette = getFirstItem(
            body.items,
            'Expected at least one palette.',
          );

          expect(Array.isArray(body.items)).toBe(true);
          expect(firstPalette.id).toBe('w1');
          expect(firstPalette.slug).toBe('morning-mist');
        }),
      );
  });

  it('/api/palettes (GET) includes deleted items when requested', async () => {
    await appendDeletedPalette();

    await request(app.getHttpServer())
      .get('/api/palettes?includeDeleted=true')
      .expect(200)
      .expect(
        expectBody<PaletteCollectionDocument>((body) => {
          const restoredItem = getItemById(
            body.items,
            'p_test_restore',
            'Expected restored palette.',
          );

          expect(restoredItem.status).toBe('deleted');
        }),
      );
  });

  it('/api/palettes (POST)', async () => {
    const payload = {
      accentColorId: 'bc_0005',
      fitPhotoScenario: false,
      id: 'p_test_create',
      isPro: false,
      moodTags: ['calm'],
      occasionId: 'workday',
      primaryColorId: 'bc_0039',
      safetyLevel: 'safe',
      seasonTags: ['all'],
      secondaryColorId: 'bc_0031',
      slug: 'palette-create-test',
      sourceCollectionIds: ['col_0001'],
      sourceType: 'curated',
      status: 'approved',
      styleTags: ['urban'],
    };

    await request(app.getHttpServer())
      .post('/api/palettes')
      .send(payload)
      .expect(201)
      .expect(
        expectBody<PaletteCollectionDocument>((body) => {
          expect(body.items.some((item) => item.id === 'p_test_create')).toBe(
            true,
          );
        }),
      );

    const fileDocument = await readJsonFile<PaletteCollectionDocument>(
      getTempPaletteDataFilePath('palettes.v1.json'),
    );
    const createdItem = getItemById(
      fileDocument.items,
      'p_test_create',
      'Expected created palette in file.',
    );

    expect(createdItem.slug).toBe('palette-create-test');
    expect(createdItem.status).toBe('approved');
    expect(createdItem.deleteReason).toBeUndefined();
  });

  it('/api/palettes/:id/delete-check (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/palettes/w1/delete-check')
      .expect(200)
      .expect(
        expectBody<PaletteDeleteCheckResult>((body) => {
          const firstBlockingReference = getFirstItem(
            body.blockingReferences,
            'Expected at least one blocking palette reference.',
          );

          expect(body.canDelete).toBe(false);
          expect(body.targetId).toBe('w1');
          expect(body.blockingReferences.length).toBeGreaterThan(0);
          expect(firstBlockingReference.resource).toBe('collection');
        }),
      );
  });

  it('/api/palettes/:id (PUT)', async () => {
    const payload = {
      accentColorId: 'bc_0005',
      fitPhotoScenario: true,
      isPro: true,
      moodTags: ['calm'],
      occasionId: 'workday',
      primaryColorId: 'bc_0039',
      safetyLevel: 'safe',
      seasonTags: ['all'],
      secondaryColorId: 'bc_0031',
      slug: 'morning-mist-updated',
      sourceCollectionIds: ['col_0001'],
      sourceType: 'curated',
      status: 'approved',
      styleTags: ['urban'],
    };

    await request(app.getHttpServer())
      .put('/api/palettes/w1')
      .send(payload)
      .expect(200)
      .expect(
        expectBody<PaletteCollectionDocument>((body) => {
          const updatedItem = getItemById(
            body.items,
            'w1',
            'Expected updated palette.',
          );

          expect(updatedItem.slug).toBe('morning-mist-updated');
          expect(updatedItem.isPro).toBe(true);
          expect(updatedItem.fitPhotoScenario).toBe(true);
        }),
      );
  });

  it('/api/palettes/:id (DELETE) blocks when referenced', () => {
    return request(app.getHttpServer())
      .delete('/api/palettes/w1')
      .send({ deleteReason: 'still in use' })
      .expect(409)
      .expect(
        expectBody<DeleteBlockedResponse<PaletteDeleteCheckResult>>((body) => {
          expect(body.message).toBe(
            'Palette is still referenced by active collections.',
          );
          expect(body.deleteCheck.canDelete).toBe(false);
          expect(body.deleteCheck.blockingReferences.length).toBeGreaterThan(0);
        }),
      );
  });

  it('/api/palettes/:id (DELETE) soft deletes an unreferenced item', async () => {
    await appendUnreferencedPalette();

    await request(app.getHttpServer())
      .delete('/api/palettes/p_test_delete')
      .send({ deleteReason: 'e2e cleanup' })
      .expect(200)
      .expect(
        expectBody<PaletteCollectionDocument>((body) => {
          expect(body.items.some((item) => item.id === 'p_test_delete')).toBe(
            false,
          );
        }),
      );

    const fileDocument = await readJsonFile<PaletteCollectionDocument>(
      getTempPaletteDataFilePath('palettes.v1.json'),
    );
    const deletedItem = getItemById(
      fileDocument.items,
      'p_test_delete',
      'Expected deleted palette in file.',
    );

    expect(deletedItem.status).toBe('deleted');
    expect(deletedItem.previousStatus).toBe('approved');
    expect(deletedItem.deleteReason).toBe('e2e cleanup');
    expect(typeof deletedItem.deletedAt).toBe('string');
    expect(deletedItem.deletedAt).not.toBe('');
  });

  it('/api/palettes/:id/restore (POST) restores a deleted item', async () => {
    await appendDeletedPalette();

    await request(app.getHttpServer())
      .post('/api/palettes/p_test_restore/restore')
      .expect(201)
      .expect(
        expectBody<PaletteCollectionDocument>((body) => {
          const restoredItem = getItemById(
            body.items,
            'p_test_restore',
            'Expected restored palette.',
          );

          expect(restoredItem.status).toBe('approved');
        }),
      );

    const fileDocument = await readJsonFile<PaletteCollectionDocument>(
      getTempPaletteDataFilePath('palettes.v1.json'),
    );
    const restoredItem = getItemById(
      fileDocument.items,
      'p_test_restore',
      'Expected restored palette in file.',
    );

    expect(restoredItem.status).toBe('approved');
    expect(restoredItem.deleteReason).toBeUndefined();
    expect(restoredItem.deletedAt).toBeUndefined();
    expect(restoredItem.previousStatus).toBeUndefined();
  });

  it('/api/collections (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/collections')
      .expect(200)
      .expect(
        expectBody<CollectionCollectionDocument>((body) => {
          const firstCollection = getFirstItem(
            body.items,
            'Expected at least one collection.',
          );

          expect(Array.isArray(body.items)).toBe(true);
          expect(firstCollection.id).toBe('col_0001');
          expect(firstCollection.nameZh).toBe('温柔通勤');
        }),
      );
  });

  it('/api/collections (GET) includes deleted items when requested', async () => {
    await appendDeletedCollection();

    await request(app.getHttpServer())
      .get('/api/collections?includeDeleted=true')
      .expect(200)
      .expect(
        expectBody<CollectionCollectionDocument>((body) => {
          const restoredItem = getItemById(
            body.items,
            'col_test_restore',
            'Expected restored collection.',
          );

          expect(restoredItem.status).toBe('deleted');
        }),
      );
  });

  it('/api/collections/:id/delete-check (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/collections/col_0001/delete-check')
      .expect(200)
      .expect(
        expectBody<CollectionDeleteCheckResult>((body) => {
          const firstBlockingReference = getFirstItem(
            body.blockingReferences,
            'Expected at least one blocking collection reference.',
          );

          expect(body.canDelete).toBe(false);
          expect(body.targetId).toBe('col_0001');
          expect(body.blockingReferences.length).toBeGreaterThan(0);
          expect(firstBlockingReference.resource).toBe('palette');
        }),
      );
  });

  it('/api/collections/:id (PUT)', async () => {
    const payload = {
      coverPaletteId: 'w2',
      descriptionEn: 'Updated in e2e coverage.',
      descriptionZh: '用于 e2e 更新覆盖。',
      isPro: true,
      nameEn: 'Gentle Commute Updated',
      nameZh: '温柔通勤更新版',
      occasionTags: ['workday'],
      paletteIds: ['w1', 'w2', 'w3'],
      releaseMode: 'permanent',
      status: 'ready',
      styleTags: ['urban'],
      themeType: 'scene',
    };

    await request(app.getHttpServer())
      .put('/api/collections/col_0001')
      .send(payload)
      .expect(200)
      .expect(
        expectBody<CollectionCollectionDocument>((body) => {
          const updatedItem = getItemById(
            body.items,
            'col_0001',
            'Expected updated collection.',
          );

          expect(updatedItem.nameZh).toBe('温柔通勤更新版');
          expect(updatedItem.coverPaletteId).toBe('w2');
          expect(updatedItem.isPro).toBe(true);
          expect(updatedItem.status).toBe('ready');
        }),
      );
  });

  it('/api/collections/:id (PUT) rejects when cover palette is not a member', async () => {
    const payload = {
      coverPaletteId: 'w4',
      descriptionEn: 'Updated in e2e coverage.',
      descriptionZh: '用于 e2e 更新覆盖。',
      isPro: true,
      nameEn: 'Gentle Commute Updated',
      nameZh: '温柔通勤更新版',
      occasionTags: ['workday'],
      paletteIds: ['w1', 'w2', 'w3'],
      releaseMode: 'permanent',
      status: 'ready',
      styleTags: ['urban'],
      themeType: 'scene',
    };

    await request(app.getHttpServer())
      .put('/api/collections/col_0001')
      .send(payload)
      .expect(400)
      .expect(
        expectBody<MessageResponse>((body) => {
          expect(body.message).toBe(
            'coverPaletteId must also appear in paletteIds.',
          );
        }),
      );
  });

  it('/api/collections/:id (DELETE) blocks when referenced', () => {
    return request(app.getHttpServer())
      .delete('/api/collections/col_0001')
      .send({ deleteReason: 'still in use' })
      .expect(409)
      .expect(
        expectBody<DeleteBlockedResponse<CollectionDeleteCheckResult>>(
          (body) => {
            expect(body.message).toBe(
              'Collection is still referenced by active palettes.',
            );
            expect(body.deleteCheck.canDelete).toBe(false);
            expect(body.deleteCheck.blockingReferences.length).toBeGreaterThan(
              0,
            );
          },
        ),
      );
  });

  it('/api/collections/:id (DELETE) soft deletes an unreferenced item', async () => {
    await appendUnreferencedCollection();

    await request(app.getHttpServer())
      .delete('/api/collections/col_test_delete')
      .send({ deleteReason: 'e2e cleanup' })
      .expect(200)
      .expect(
        expectBody<CollectionCollectionDocument>((body) => {
          expect(body.items.some((item) => item.id === 'col_test_delete')).toBe(
            false,
          );
        }),
      );

    const fileDocument = await readJsonFile<CollectionCollectionDocument>(
      getTempPaletteDataFilePath('collections.v1.json'),
    );
    const deletedItem = getItemById(
      fileDocument.items,
      'col_test_delete',
      'Expected deleted collection in file.',
    );

    expect(deletedItem.status).toBe('deleted');
    expect(deletedItem.previousStatus).toBe('ready');
    expect(deletedItem.deleteReason).toBe('e2e cleanup');
    expect(typeof deletedItem.deletedAt).toBe('string');
    expect(deletedItem.deletedAt).not.toBe('');
  });

  it('/api/collections/:id/restore (POST) restores a deleted item', async () => {
    await appendDeletedCollection();

    await request(app.getHttpServer())
      .post('/api/collections/col_test_restore/restore')
      .expect(201)
      .expect(
        expectBody<CollectionCollectionDocument>((body) => {
          const restoredItem = getItemById(
            body.items,
            'col_test_restore',
            'Expected restored collection.',
          );

          expect(restoredItem.status).toBe('published');
        }),
      );

    const fileDocument = await readJsonFile<CollectionCollectionDocument>(
      getTempPaletteDataFilePath('collections.v1.json'),
    );
    const restoredItem = getItemById(
      fileDocument.items,
      'col_test_restore',
      'Expected restored collection in file.',
    );

    expect(restoredItem.status).toBe('published');
    expect(restoredItem.deleteReason).toBeUndefined();
    expect(restoredItem.deletedAt).toBeUndefined();
    expect(restoredItem.previousStatus).toBeUndefined();
  });

  it('/api/dictionaries/:key/items/:id/delete-check (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/dictionaries/occasion/items/workday/delete-check')
      .expect(200)
      .expect(
        expectBody<DictionaryItemDeleteCheckResult>((body) => {
          expect(body.canDelete).toBe(false);
          expect(body.dictionaryKey).toBe('occasion');
          expect(body.itemId).toBe('workday');
          expect(body.blockingReferences.length).toBeGreaterThan(0);
        }),
      );
  });

  it('/api/dictionaries/:key/items/:id (DELETE) blocks when referenced', () => {
    return request(app.getHttpServer())
      .delete('/api/dictionaries/occasion/items/workday')
      .send({ deleteReason: 'still in use' })
      .expect(409)
      .expect(
        expectBody<DeleteBlockedResponse<DictionaryItemDeleteCheckResult>>(
          (body) => {
            expect(body.message).toBe(
              'Dictionary item is still referenced by active records.',
            );
            expect(body.deleteCheck.canDelete).toBe(false);
            expect(body.deleteCheck.blockingReferences.length).toBeGreaterThan(
              0,
            );
          },
        ),
      );
  });

  it('/api/dictionaries/:key/items/:id (DELETE) soft deletes an unreferenced item', async () => {
    await appendUnreferencedDictionaryItem();

    await request(app.getHttpServer())
      .delete('/api/dictionaries/occasion/items/e2e_unused_occasion')
      .send({ deleteReason: 'e2e cleanup' })
      .expect(200)
      .expect(
        expectBody<DictionariesDocument>((body) => {
          const occasionDictionary = getDictionary(body, 'occasion');

          expect(
            occasionDictionary.items.some(
              (item) => item.id === 'e2e_unused_occasion',
            ),
          ).toBe(false);
        }),
      );

    const fileDocument = await readJsonFile<DictionariesDocument>(
      getTempPaletteDataFilePath('dictionaries.v1.json'),
    );
    const deletedItem = getItemById(
      getDictionary(fileDocument, 'occasion').items,
      'e2e_unused_occasion',
      'Expected deleted dictionary item in file.',
    );

    expect(deletedItem.isDeleted).toBe(true);
    expect(deletedItem.isActive).toBe(false);
    expect(deletedItem.deleteReason).toBe('e2e cleanup');
    expect(typeof deletedItem.deletedAt).toBe('string');
    expect(deletedItem.deletedAt).not.toBe('');
  });

  it('/api/dictionaries/:key/items/:id/restore (POST) restores a deleted item', async () => {
    await appendDeletedDictionaryItem();

    await request(app.getHttpServer())
      .post('/api/dictionaries/occasion/items/e2e_restore_occasion/restore')
      .expect(201)
      .expect(
        expectBody<DictionariesDocument>((body) => {
          const restoredItem = getItemById(
            getDictionary(body, 'occasion').items,
            'e2e_restore_occasion',
            'Expected restored dictionary item.',
          );

          expect(restoredItem.isDeleted).toBe(false);
        }),
      );

    const fileDocument = await readJsonFile<DictionariesDocument>(
      getTempPaletteDataFilePath('dictionaries.v1.json'),
    );
    const restoredItem = getItemById(
      getDictionary(fileDocument, 'occasion').items,
      'e2e_restore_occasion',
      'Expected restored dictionary item in file.',
    );

    expect(restoredItem.isDeleted).toBe(false);
    expect(restoredItem.isActive).toBe(true);
    expect(restoredItem.deleteReason).toBeUndefined();
    expect(restoredItem.deletedAt).toBeUndefined();
  });

  it('/api/dictionaries/:key (PUT)', async () => {
    const dictionariesResponse = await request(app.getHttpServer())
      .get('/api/dictionaries')
      .expect(200);
    const body = getResponseBody<DictionariesDocument>(dictionariesResponse);
    const occasionDictionary = getDictionary(body, 'occasion');
    const payload = {
      ...occasionDictionary,
      items: occasionDictionary.items.map((item) =>
        item.id === 'dinner' ? { ...item, labelZh: '晚宴场景' } : item,
      ),
      labelZh: '场合字典',
    };

    await request(app.getHttpServer())
      .put('/api/dictionaries/occasion')
      .send(payload)
      .expect(200)
      .expect(
        expectBody<DictionariesDocument>((updatedBody) => {
          const updatedOccasionDictionary = getDictionary(
            updatedBody,
            'occasion',
          );
          const dinnerItem = getItemById(
            updatedOccasionDictionary.items,
            'dinner',
            'Expected dinner dictionary item.',
          );

          expect(updatedOccasionDictionary.labelZh).toBe('场合字典');
          expect(dinnerItem.labelZh).toBe('晚宴场景');
        }),
      );
  });

  it('/api/base-colors (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/base-colors')
      .expect(200)
      .expect(
        expectBody<BaseColorCollectionDocument>((body) => {
          const firstBaseColor = getFirstItem(
            body.items,
            'Expected at least one base color.',
          );

          expect(body.version).toBe(1);
          expect(Array.isArray(body.items)).toBe(true);
          expect(body.items.length).toBeGreaterThan(0);
          expect(firstBaseColor.id).toBe('bc_0001');
        }),
      );
  });

  it('/api/base-colors (GET) includes deleted items when requested', async () => {
    await appendDeletedBaseColor();

    await request(app.getHttpServer())
      .get('/api/base-colors?includeDeleted=true')
      .expect(200)
      .expect(
        expectBody<BaseColorCollectionDocument>((body) => {
          const restoredItem = getItemById(
            body.items,
            'bc_test_restore',
            'Expected restored base color.',
          );

          expect(restoredItem.status).toBe('deleted');
        }),
      );
  });

  it('/api/base-colors (POST)', async () => {
    const payload = {
      colorFamily: 'green',
      hex: '#1ABC9C',
      id: 'bc_test_create',
      isNeutralCore: false,
      lightnessLevel: 'mid',
      nameEn: 'Create Test Mint',
      nameZh: '新增测试薄荷',
      occasionTags: ['weekend'],
      saturationLevel: 'high',
      seasonTags: ['summer'],
      status: 'approved',
      styleTags: ['clean'],
      tone: 'cool',
    };

    await request(app.getHttpServer())
      .post('/api/base-colors')
      .send(payload)
      .expect(201)
      .expect(
        expectBody<BaseColorCollectionDocument>((body) => {
          expect(body.items.some((item) => item.id === 'bc_test_create')).toBe(
            true,
          );
        }),
      );

    const fileDocument = await readJsonFile<BaseColorCollectionDocument>(
      getTempPaletteDataFilePath('base-colors.v1.json'),
    );
    const createdItem = getItemById(
      fileDocument.items,
      'bc_test_create',
      'Expected created base color in file.',
    );

    expect(createdItem.nameZh).toBe('新增测试薄荷');
    expect(createdItem.status).toBe('approved');
  });

  it('/api/base-colors/:id/delete-check (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/base-colors/bc_0001/delete-check')
      .expect(200)
      .expect(
        expectBody<BaseColorDeleteCheckResult>((body) => {
          const firstBlockingReference = getFirstItem(
            body.blockingReferences,
            'Expected at least one blocking base color reference.',
          );

          expect(body.canDelete).toBe(false);
          expect(body.targetId).toBe('bc_0001');
          expect(body.blockingReferences.length).toBeGreaterThan(0);
          expect(firstBlockingReference.resource).toBe('palette');
        }),
      );
  });

  it('/api/base-colors/:id (PUT)', async () => {
    const payload = {
      colorFamily: 'green',
      hex: '#12AB34',
      isNeutralCore: true,
      lightnessLevel: 'mid',
      nameEn: 'Updated Teal',
      nameZh: '更新海青',
      occasionTags: ['weekend', 'workday'],
      saturationLevel: 'high',
      seasonTags: ['spring', 'summer'],
      status: 'approved',
      styleTags: ['clean', 'fresh'],
      tone: 'cool',
    };

    await request(app.getHttpServer())
      .put('/api/base-colors/bc_0001')
      .send(payload)
      .expect(200)
      .expect(
        expectBody<BaseColorCollectionDocument>((body) => {
          const updatedItem = getItemById(
            body.items,
            'bc_0001',
            'Expected updated base color.',
          );

          expect(updatedItem.hex).toBe('#12AB34');
          expect(updatedItem.nameZh).toBe('更新海青');
          expect(updatedItem.occasionTags).toEqual(['weekend', 'workday']);
        }),
      );

    await request(app.getHttpServer())
      .get('/api/base-colors')
      .expect(200)
      .expect(
        expectBody<BaseColorCollectionDocument>((body) => {
          const updatedItem = getItemById(
            body.items,
            'bc_0001',
            'Expected updated base color after refetch.',
          );

          expect(updatedItem.nameEn).toBe('Updated Teal');
          expect(updatedItem.styleTags).toEqual(['clean', 'fresh']);
        }),
      );
  });

  it('/api/base-colors/:id (DELETE) blocks when referenced', () => {
    return request(app.getHttpServer())
      .delete('/api/base-colors/bc_0001')
      .send({ deleteReason: 'still in use' })
      .expect(409)
      .expect(
        expectBody<DeleteBlockedResponse<BaseColorDeleteCheckResult>>(
          (body) => {
            expect(body.message).toBe(
              'Base color is still referenced by active palettes.',
            );
            expect(body.deleteCheck.canDelete).toBe(false);
            expect(body.deleteCheck.blockingReferences.length).toBeGreaterThan(
              0,
            );
          },
        ),
      );
  });

  it('/api/base-colors/:id (DELETE) soft deletes an unreferenced item', async () => {
    await appendUnreferencedBaseColor();

    await request(app.getHttpServer())
      .delete('/api/base-colors/bc_test_delete')
      .send({ deleteReason: 'e2e cleanup' })
      .expect(200)
      .expect(
        expectBody<BaseColorCollectionDocument>((body) => {
          expect(body.items.some((item) => item.id === 'bc_test_delete')).toBe(
            false,
          );
        }),
      );

    const fileDocument = await readJsonFile<BaseColorCollectionDocument>(
      getTempPaletteDataFilePath('base-colors.v1.json'),
    );
    const deletedItem = getItemById(
      fileDocument.items,
      'bc_test_delete',
      'Expected deleted base color in file.',
    );

    expect(deletedItem.status).toBe('deleted');
    expect(deletedItem.previousStatus).toBe('approved');
    expect(deletedItem.deleteReason).toBe('e2e cleanup');
    expect(typeof deletedItem.deletedAt).toBe('string');
    expect(deletedItem.deletedAt).not.toBe('');
  });

  it('/api/base-colors/:id/restore (POST) restores a deleted item', async () => {
    await appendDeletedBaseColor();

    await request(app.getHttpServer())
      .post('/api/base-colors/bc_test_restore/restore')
      .expect(201)
      .expect(
        expectBody<BaseColorCollectionDocument>((body) => {
          const restoredItem = getItemById(
            body.items,
            'bc_test_restore',
            'Expected restored base color.',
          );

          expect(restoredItem.status).toBe('approved');
        }),
      );

    const fileDocument = await readJsonFile<BaseColorCollectionDocument>(
      getTempPaletteDataFilePath('base-colors.v1.json'),
    );
    const restoredItem = getItemById(
      fileDocument.items,
      'bc_test_restore',
      'Expected restored base color in file.',
    );

    expect(restoredItem.status).toBe('approved');
    expect(restoredItem.deleteReason).toBeUndefined();
    expect(restoredItem.deletedAt).toBeUndefined();
    expect(restoredItem.previousStatus).toBeUndefined();
  });

  afterEach(async () => {
    await app.close();
    process.env.DAY_PALETTE_ROOT = previousDayPaletteRoot;
    await rm(temporaryDayPaletteRoot, { force: true, recursive: true });
  });
});
