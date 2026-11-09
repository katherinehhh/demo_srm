import { defineMigration } from '@nocobase/db';

const categories = ['equipment', 'service', 'both'] as const;

export default defineMigration({
  name: '202611090002_supplier_admission_rules',
  async up({ builder, query }) {
    await builder.createCollection('supplierAdmissionRules', (c) => {
      c.uuid('id').primary().notNull();
      c.string('category', { length: 32 }).notNull();
      c.string('typeCode', { length: 64 }).notNull();
      c.boolean('required').notNull();
      c.boolean('checkValidity').notNull();
      c.boolean('enabled').notNull();
      c.datetimeTz('createdAt').notNull();
      c.datetimeTz('updatedAt').notNull();
      c.unique(['category', 'typeCode']);
    });
    await builder.createCollection('supplierSubmissionSnapshots', (c) => {
      c.uuid('id').primary().notNull();
      c.uuid('supplierId').notNull();
      c.uuid('submitEventId').nullable();
      c.string('category', { length: 32 }).notNull();
      c.string('source', { length: 32 }).notNull();
      c.json('requirements').notNull();
      c.json('results').notNull();
      c.datetimeTz('submittedAt').notNull();
      c.index(['supplierId', 'submittedAt']);
    });
    await builder.alterCollection('supplierQualifications', (c) => {
      c.alterField('validUntil', { type: 'string', length: 10, nullable: true });
    });
    const types = await query.selectFrom('supplierQualificationTypes').selectAll().execute();
    const now = new Date();
    for (const type of types) {
      const targets = type.category === 'all' ? categories : [String(type.category)];
      for (const category of targets) {
        if (!categories.includes(category as (typeof categories)[number])) continue;
        await query.insertInto('supplierAdmissionRules').values({
          id: crypto.randomUUID(), category, typeCode: type.code,
          required: type.required, checkValidity: true, enabled: type.enabled,
          createdAt: now, updatedAt: now,
        }).execute();
      }
    }
    // A pre-feature pending request has no reconstructable original policy.
    // Preserve a clearly labeled baseline rather than presenting it as the original submission rule.
    const pending = await query.selectFrom('suppliers').selectAll()
      .where('status', 'in', ['pending', 'renewalPending']).execute();
    for (const supplier of pending) {
      const requirements = await query.selectFrom('supplierAdmissionRules').selectAll()
        .where('category', '=', supplier.category).where('enabled', '=', true).execute();
      const rows = await query.selectFrom('supplierQualifications').selectAll()
        .where('supplierId', '=', supplier.id).where('stage', '=', 'proposed').execute();
      await query.insertInto('supplierSubmissionSnapshots').values({
        id: crypto.randomUUID(), supplierId: supplier.id, submitEventId: null,
        category: supplier.category, source: 'migration-baseline',
        requirements: JSON.stringify(requirements.map((r) => ({ typeCode: r.typeCode, required: r.required, checkValidity: r.checkValidity }))),
        results: JSON.stringify(rows.map((r) => ({ typeCode: r.typeCode, fileId: r.fileId, validUntil: r.validUntil }))),
        submittedAt: now,
      }).execute();
    }
  },
  async down({ builder }) {
    await builder.alterCollection('supplierQualifications', (c) => {
      c.alterField('validUntil', { type: 'string', length: 10, nullable: false });
    });
    await builder.dropCollection('supplierSubmissionSnapshots');
    await builder.dropCollection('supplierAdmissionRules');
  },
});
