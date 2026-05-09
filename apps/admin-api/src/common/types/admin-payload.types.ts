export type AdminResourceKey =
  | 'dictionaries'
  | 'base-colors'
  | 'palettes'
  | 'collections';

export interface AdminApiOverview {
  name: string;
  resources: Array<{
    path: string;
    resource: string;
  }>;
  status: 'ok';
}

export interface AdminResourceSnapshot {
  items: unknown[];
  message: string;
  resource: AdminResourceKey;
  status: 'scaffold';
}
