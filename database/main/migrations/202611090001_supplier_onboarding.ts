import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611090001_supplier_onboarding',
  async up({ builder }) {
    await builder.createCollection('suppliers', (c) => {
      c.uuid('id').primary().notNull();
      c.string('ownerId', { length: 191 }).notNull();
      c.unique('ownerId');
      c.string('name', { length: 200 }).notNull();
      c.string('creditCode', { length: 32 }).notNull();
      c.unique('creditCode');
      c.string('category', { length: 32 }).notNull();
      c.string('contactName', { length: 100 }).notNull();
      c.string('contactPhone', { length: 50 }).notNull();
      c.string('contactEmail', { length: 255 }).notNull();
      c.string('address', { length: 500 }).nullable();
      c.text('notes').nullable();
      c.string('status', { length: 32 }).notNull();
      c.integer('version').notNull().defaultTo(1);
      c.string('reviewerId', { length: 191 }).nullable();
      c.text('reviewNote').nullable();
      c.datetimeTz('reviewedAt').nullable();
      c.datetimeTz('createdAt').notNull();
      c.datetimeTz('updatedAt').notNull();
      c.index(['status', 'updatedAt']);
    });
    await builder.createCollection('supplierQualificationTypes', (c) => {
      c.string('code', { length: 64 }).primary().notNull();
      c.string('name', { length: 150 }).notNull();
      c.string('category', { length: 32 }).notNull();
      c.boolean('required').notNull().defaultTo(false);
      c.boolean('enabled').notNull().defaultTo(true);
      c.datetimeTz('createdAt').notNull();
      c.datetimeTz('updatedAt').notNull();
    });
    await builder.createCollection('supplierQualifications', (c) => {
      c.uuid('id').primary().notNull();
      c.uuid('supplierId').notNull();
      c.string('typeCode', { length: 64 }).notNull();
      c.string('certificateNumber', { length: 120 }).nullable();
      c.string('validUntil', { length: 10 }).notNull();
      c.uuid('fileId').notNull();
      c.string('stage', { length: 16 }).notNull();
      c.datetimeTz('createdAt').notNull();
      c.datetimeTz('updatedAt').notNull();
      c.index(['supplierId', 'stage']);
      c.index('validUntil');
    });
    await builder.createCollection('supplierFiles', (c) => {
      c.uuid('id').primary().notNull();
      c.string('disk', { length: 255 }).notNull();
      c.text('key').notNull();
      c.text('filename').notNull();
      c.string('ext', { length: 32 }).notNull();
      c.string('mimeType', { length: 255 }).notNull();
      c.bigInt('size').notNull();
      c.string('ownerId', { length: 191 }).notNull();
      c.datetimeTz('createdAt').notNull();
      c.datetimeTz('updatedAt').notNull();
      c.index('ownerId');
    });
    await builder.createCollection('supplierReviewEvents', (c) => {
      c.uuid('id').primary().notNull();
      c.uuid('supplierId').notNull();
      c.string('actorId', { length: 191 }).notNull();
      c.string('action', { length: 32 }).notNull();
      c.string('fromStatus', { length: 32 }).notNull();
      c.string('toStatus', { length: 32 }).notNull();
      c.text('note').nullable();
      c.string('operationKey', { length: 191 }).notNull();
      c.unique(['supplierId', 'operationKey']);
      c.datetimeTz('createdAt').notNull();
      c.index(['supplierId', 'createdAt']);
    });
    await builder.createCollection('supplierSettings', (c) => {
      c.string('id', { length: 32 }).primary().notNull();
      c.string('reviewerId', { length: 191 }).notNull();
      c.integer('warningDays').notNull();
      c.integer('revision').notNull();
      c.datetimeTz('updatedAt').notNull();
      c.string('updatedBy', { length: 191 }).nullable();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('supplierSettings');
    await builder.dropCollection('supplierReviewEvents');
    await builder.dropCollection('supplierFiles');
    await builder.dropCollection('supplierQualifications');
    await builder.dropCollection('supplierQualificationTypes');
    await builder.dropCollection('suppliers');
  },
});
