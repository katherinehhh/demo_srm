import { defineSeed } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';

export default defineSeed({
  name: '202611090001_supplier_defaults',
  transaction: true,
  async run({ query }) {
    const now = new Date();
    const reviewer = await query
      .selectFrom('user')
      .select('id')
      .where('username', '=', 'nocobase')
      .executeTakeFirst();
    if (!reviewer?.id) throw new Error('Initial supplier reviewer account nocobase is missing');
    if (!(await query.selectFrom('supplierSettings').select('id').where('id', '=', 'default').executeTakeFirst())) {
      await query.insertInto('supplierSettings').values({
        id: 'default', reviewerId: reviewer.id, warningDays: 30,
        revision: 1, updatedAt: now, updatedBy: null,
      }).execute();
    }
    if (!(await query.selectFrom('supplierQualificationTypes').select('code').where('code', '=', 'business-license').executeTakeFirst())) {
      await query.insertInto('supplierQualificationTypes').values({
        code: 'business-license', name: 'Business license', category: 'all',
        required: true, enabled: true, createdAt: now, updatedAt: now,
      }).execute();
    }
    const viewer = definePermissionSet('supplier-directory-viewer')
      .title({ ns: 'app', key: 'suppliers.roles.viewer' })
      .grant({ resource: { type: 'page', id: 'supplierDirectory' }, actions: [{ action: 'access' }] })
      .grant({ resource: { type: 'page', id: 'supplierExpiring' }, actions: [{ action: 'access' }] })
      .grant({ resource: { type: 'settings', id: 'suppliers.directory' }, actions: [{ action: 'read' }] })
      .build();
    if (!(await query.selectFrom('authorizationPermissionSets').select('id').where('key', '=', viewer.key).executeTakeFirst())) {
      await query.insertInto('authorizationPermissionSets').values({
        id: viewer.key, key: viewer.key,
        title: encodeAuthorizationTitle(viewer.title),
        grants: JSON.stringify(viewer.grants),
        createdAt: now, updatedAt: now,
      }).execute();
    }
  },
});
