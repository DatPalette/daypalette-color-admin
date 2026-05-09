import {
  type AdminResourceKey,
  type AdminResourceSnapshot,
} from '../types/admin-payload.types';

export function buildAdminResourceSnapshot(
  resource: AdminResourceKey,
  message: string,
): AdminResourceSnapshot {
  return {
    items: [],
    message,
    resource,
    status: 'scaffold',
  };
}
