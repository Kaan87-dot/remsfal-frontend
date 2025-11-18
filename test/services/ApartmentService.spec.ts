import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { apartmentService } from '../../src/services/ApartmentService';
import type { Apartment } from '../../src/services/ApartmentService';

const mockApartment: Apartment = {
  id: 'apartment-1',
  title: 'Test Apartment',
  description: 'A test apartment',
};

const handlers = [
  // POST create apartment
  http.post(
    '/api/v1/projects/:projectId/buildings/:buildingId/apartments',
    async ({ request }) => {
      const body = (await request.json()) as Apartment;
      return HttpResponse.json(
        { id: 'apartment-new-id', ...body },
        { status: 201 },
      );
    },
  ),

  // GET apartment
  http.get(
    '/api/v1/projects/:projectId/apartments/:apartmentId',
    () => {
      return HttpResponse.json(mockApartment, { status: 200 });
    },
  ),

  // PATCH update apartment
  http.patch(
    '/api/v1/projects/:projectId/apartments/:apartmentId',
    async ({ request }) => {
      const body = (await request.json()) as Partial<Apartment>;
      return HttpResponse.json({ ...mockApartment, ...body }, { status: 200 });
    },
  ),

  // DELETE apartment
  http.delete(
    '/api/v1/projects/:projectId/apartments/:apartmentId',
    () => {
      return new HttpResponse(null, { status: 204 });
    },
  ),
];

const server = setupServer(...handlers);

describe('ApartmentService with MSW', () => {
  const projectId = 'project-1';
  const buildingId = 'building-1';
  const apartmentId = 'apartment-1';

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('createApartment returns newly created apartment', async () => {
    const newApartment = {
      title: 'New Apartment',
      description: 'Test description',
    };

    const created = await apartmentService.createApartment(
      projectId,
      buildingId,
      newApartment,
    );
    expect(created).toMatchObject({
      id: 'apartment-new-id',
      ...newApartment,
    });
  });

  test('getApartment returns apartment data', async () => {
    const apartment = await apartmentService.getApartment(projectId, apartmentId);
    expect(apartment).toEqual(mockApartment);
  });

  test('updateApartment returns updated apartment', async () => {
    const updates = { title: 'Updated Apartment' };

    const updated = await apartmentService.updateApartment(
      projectId,
      apartmentId,
      updates,
    );
    expect(updated).toMatchObject({
      id: apartmentId,
      ...updates,
    });
  });

  test('deleteApartment succeeds', async () => {
    await expect(
      apartmentService.deleteApartment(projectId, apartmentId),
    ).resolves.toBe(true);
  });

  test('deleteApartment handles errors', async () => {
    server.use(
      http.delete(
        '/api/v1/projects/:projectId/apartments/:apartmentId',
        () => {
          return HttpResponse.error();
        },
      ),
    );

    const result = await apartmentService.deleteApartment(projectId, apartmentId);
    expect(result).toBe(false);
  });

  test('getApartment handles errors', async () => {
    server.use(
      http.get(
        '/api/v1/projects/:projectId/apartments/:apartmentId',
        () => {
          return new HttpResponse(null, { status: 404 });
        },
      ),
    );

    await expect(
      apartmentService.getApartment(projectId, apartmentId),
    ).rejects.toEqual(404);
  });
});
