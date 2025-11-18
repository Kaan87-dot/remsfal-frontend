import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { buildingService } from '../../src/services/BuildingService';
import type { Building } from '../../src/services/BuildingService';

const mockBuilding: Building = {
  id: 'building-1',
  title: 'Test Building',
  description: 'A test building',
};

const handlers = [
  // POST create building
  http.post(
    '/api/v1/projects/:projectId/properties/:propertyId/buildings',
    async ({ request }) => {
      const body = (await request.json()) as Building;
      return HttpResponse.json(
        { id: 'building-new-id', ...body },
        { status: 201 },
      );
    },
  ),

  // GET building
  http.get(
    '/api/v1/projects/:projectId/buildings/:buildingId',
    () => {
      return HttpResponse.json(mockBuilding, { status: 200 });
    },
  ),

  // PATCH update building
  http.patch(
    '/api/v1/projects/:projectId/buildings/:buildingId',
    async ({ request }) => {
      const body = (await request.json()) as Partial<Building>;
      return HttpResponse.json({ ...mockBuilding, ...body }, { status: 200 });
    },
  ),

  // DELETE building
  http.delete(
    '/api/v1/projects/:projectId/buildings/:buildingId',
    () => {
      return new HttpResponse(null, { status: 204 });
    },
  ),
];

const server = setupServer(...handlers);

describe('BuildingService with MSW', () => {
  const projectId = 'project-1';
  const propertyId = 'property-1';
  const buildingId = 'building-1';

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('createBuilding returns newly created building', async () => {
    const newBuilding = {
      title: 'New Building',
      description: 'Test description',
    };

    const created = await buildingService.createBuilding(
      projectId,
      propertyId,
      newBuilding,
    );
    expect(created).toMatchObject({
      id: 'building-new-id',
      ...newBuilding,
    });
  });

  test('getBuilding returns building data', async () => {
    const building = await buildingService.getBuilding(projectId, buildingId);
    expect(building).toEqual(mockBuilding);
  });

  test('updateBuilding returns updated building', async () => {
    const updates = { title: 'Updated Building' };

    const updated = await buildingService.updateBuilding(
      projectId,
      buildingId,
      updates,
    );
    expect(updated).toMatchObject({
      id: buildingId,
      ...updates,
    });
  });

  test('deleteBuilding succeeds', async () => {
    await expect(
      buildingService.deleteBuilding(projectId, buildingId),
    ).resolves.toBeUndefined();
  });
});
