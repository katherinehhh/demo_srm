import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202611090002_supplier_admission_rules', {
  sources: [
    {
      packageName: 'supplier-rules-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  up: async ({ connection, expectCollection }) => {
    await expectCollection('supplierAdmissionRules').toExist();
    await expectCollection('supplierSubmissionSnapshots').toExist();
    await expectCollection('supplierQualifications').toHaveField('validUntil', {
      nullable: true,
    });
    const now = new Date();
    const rule = {
      category: 'equipment',
      typeCode: 'test-license',
      required: true,
      checkValidity: true,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };
    await connection.query
      .insertInto('supplierAdmissionRules')
      .values({
        ...rule,
        id: 'b77ab5ec-3e44-47ea-a6e7-47273cead086',
      })
      .execute();
    await expect(
      connection.query
        .insertInto('supplierAdmissionRules')
        .values({
          ...rule,
          id: 'bfebf4c5-8d3d-47d0-8932-b8f5bb884060',
        })
        .execute(),
    ).rejects.toThrow();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('supplierAdmissionRules').not.toExist();
    await expectCollection('supplierSubmissionSnapshots').not.toExist();
    await expectCollection('supplierQualifications').toHaveField('validUntil', {
      nullable: false,
    });
  },
});
