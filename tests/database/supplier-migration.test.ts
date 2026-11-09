import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202611090001_supplier_onboarding', {
  sources: [
    {
      packageName: 'supplier-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  up: async ({ connection, expectCollection }) => {
    for (const name of [
      'suppliers',
      'supplierQualificationTypes',
      'supplierQualifications',
      'supplierFiles',
      'supplierReviewEvents',
      'supplierSettings',
    ]) {
      await expectCollection(name).toExist();
    }
    await expectCollection('suppliers').toHaveField('ownerId', {
      nullable: false,
    });
    await expectCollection('supplierQualifications').toHaveField('validUntil', {
      nullable: false,
    });
    const now = new Date();
    const supplier = {
      id: 'b77ab5ec-3e44-47ea-a6e7-47273cead086',
      ownerId: 'owner-1',
      name: 'Supplier',
      creditCode: 'CREDIT-1',
      category: 'equipment',
      contactName: 'Contact',
      contactPhone: '123',
      contactEmail: 'a@example.test',
      status: 'draft',
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    await connection.query.insertInto('suppliers').values(supplier).execute();
    await expect(
      connection.query
        .insertInto('suppliers')
        .values({
          ...supplier,
          id: 'bfebf4c5-8d3d-47d0-8932-b8f5bb884060',
          creditCode: 'CREDIT-2',
        })
        .execute(),
    ).rejects.toThrow();
  },
  down: async ({ expectCollection }) => {
    for (const name of [
      'supplierSettings',
      'supplierReviewEvents',
      'supplierFiles',
      'supplierQualifications',
      'supplierQualificationTypes',
      'suppliers',
    ])
      await expectCollection(name).not.toExist();
  },
});
