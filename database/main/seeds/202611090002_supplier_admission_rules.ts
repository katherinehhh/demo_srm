import { randomUUID } from 'node:crypto';
import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202611090002_supplier_admission_rules',
  transaction: true,
  async run({ query }) {
    const type = await query.selectFrom('supplierQualificationTypes').select('code')
      .where('code', '=', 'business-license').executeTakeFirst();
    if (!type) throw new Error('Default qualification type is missing');
    const now = new Date();
    for (const category of ['equipment', 'service', 'both']) {
      const existing = await query.selectFrom('supplierAdmissionRules').select('id')
        .where('category', '=', category).where('typeCode', '=', type.code).executeTakeFirst();
      if (existing) continue;
      await query.insertInto('supplierAdmissionRules').values({
        id: randomUUID(), category, typeCode: type.code,
        required: true, checkValidity: true, enabled: true,
        createdAt: now, updatedAt: now,
      }).execute();
    }
  },
});
