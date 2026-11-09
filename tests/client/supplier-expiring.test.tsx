import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { expect, it, vi } from 'vitest';
import SupplierExpiringPage from '../../client/pages/suppliers/expiring.js';
import SupplierDirectoryPage from '../../client/pages/suppliers/directory.js';
import enUS from '../../client/locales/en-US.js';
import packageMetadata from '../../package.json' with { type: 'json' };

const rows = [
  {
    id: 'qualification-1',
    supplierId: 'supplier-1',
    supplierName: 'Power Parts',
    typeCode: 'business-license',
    validUntil: '2026-11-20',
    expiryState: 'expiring',
  },
  {
    id: 'qualification-2',
    supplierId: 'supplier-2',
    supplierName: 'Grid Services',
    typeCode: 'service-license',
    validUntil: '2026-10-20',
    expiryState: 'expired',
  },
];

it('highlights expiring and expired qualifications with distinct status treatments', async () => {
  const api = vi.fn(({ path }: ApiCall) =>
    path === 'suppliers/expiring'
      ? { data: rows }
      : new Response(null, { status: 404 }),
  );
  await renderWithApp(
    <Routes>
      <Route path='/supplier-expiring' element={<SupplierExpiringPage />} />
    </Routes>,
    {
      route: '/supplier-expiring',
      namespace: packageMetadata.name,
      namespaces: { [packageMetadata.name]: enUS },
      fetch: answerApi(api),
    },
  );
  const expiring = await screen.findByText(enUS.suppliers.expiry.expiring);
  const expired = screen.getByText(enUS.suppliers.expiry.expired);
  expect(expiring.closest('[data-slot="badge"]')).toHaveClass(
    'bg-(--status-warning-background)',
  );
  expect(expired.closest('[data-slot="badge"]')).toHaveClass(
    'bg-destructive/10',
  );
  expect(screen.getByText('2026-11-20')).toHaveClass('font-semibold');
  expect(screen.getByText('2026-10-20')).toHaveClass('text-destructive');
});

it('uses the same warning treatment in the qualified supplier directory', async () => {
  const api = vi.fn(({ path }: ApiCall) =>
    path === 'suppliers/directory'
      ? {
          data: [
            {
              id: 'supplier-1',
              name: 'Power Parts',
              creditCode: '9131',
              category: 'equipment',
              expiryState: 'expiring',
              contactName: 'Contact',
              contactPhone: '123',
            },
          ],
        }
      : new Response(null, { status: 404 }),
  );
  await renderWithApp(
    <Routes>
      <Route path='/supplier-directory' element={<SupplierDirectoryPage />} />
    </Routes>,
    {
      route: '/supplier-directory',
      namespace: packageMetadata.name,
      namespaces: { [packageMetadata.name]: enUS },
      fetch: answerApi(api),
    },
  );
  expect(
    (await screen.findByText(enUS.suppliers.expiry.expiring)).closest(
      '[data-slot="badge"]',
    ),
  ).toHaveClass('bg-(--status-warning-background)');
});
