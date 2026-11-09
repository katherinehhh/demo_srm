import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { expect, it, vi } from 'vitest';
import SupplierDetailPage from '../../client/pages/suppliers/detail.js';
import enUS from '../../client/locales/en-US.js';
import packageMetadata from '../../package.json' with { type: 'json' };

it('shows the submitted requirements and their check results to the reviewer', async () => {
  const api = vi.fn(({ path }: ApiCall) => {
    if (path !== 'suppliers/11111111-1111-4111-8111-111111111111')
      return new Response(null, { status: 404 });
    return {
      data: {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Test supplier',
        category: 'equipment',
        status: 'pending',
        canReview: true,
        version: 2,
        creditCode: 'CREDIT-1',
        contactName: 'Contact',
        contactPhone: '123',
        contactEmail: 'contact@example.test',
        qualifications: [],
        events: [],
        submissions: [
          {
            id: 'snapshot-1',
            source: 'submission',
            category: 'equipment',
            submittedAt: '2026-11-09T00:00:00.000Z',
            requirements: [
              {
                typeCode: 'business-license',
                name: 'Business license',
                required: true,
                checkValidity: true,
              },
            ],
            results: [
              {
                typeCode: 'business-license',
                name: 'Business license',
                required: true,
                checkValidity: true,
                fileId: 'file-1',
                validUntil: '2027-11-09',
                status: 'complete',
              },
            ],
          },
        ],
      },
    };
  });
  await renderWithApp(
    <Routes>
      <Route path='/suppliers/:id' element={<SupplierDetailPage />} />
    </Routes>,
    {
      route: '/suppliers/11111111-1111-4111-8111-111111111111',
      namespace: packageMetadata.name,
      namespaces: { [packageMetadata.name]: enUS },
      fetch: answerApi(api),
    },
  );
  expect(
    await screen.findByText(enUS.suppliers.checklist.submissionRules),
  ).toBeInTheDocument();
  expect(screen.getByText(/Check expiration/)).toBeInTheDocument();
  expect(screen.getByText(/Complete/)).toBeInTheDocument();
});

it('requires an explicit confirmation before returning an application', async () => {
  const supplierId = '11111111-1111-4111-8111-111111111111';
  const supplier = {
    id: supplierId,
    name: 'Test supplier',
    version: 2,
    category: 'equipment',
    status: 'pending',
    canReview: true,
    creditCode: 'CREDIT-1',
    contactName: 'Contact',
    contactPhone: '123',
    contactEmail: 'contact@example.test',
    qualifications: [],
    events: [],
    submissions: [
      {
        id: 'snapshot-1',
        source: 'submission',
        category: 'equipment',
        submittedAt: '2026-11-09T00:00:00.000Z',
        requirements: [],
        results: [],
      },
    ],
  };
  const api = vi.fn(({ path, method }: ApiCall) => {
    if (path === `suppliers/${supplierId}`) return { data: supplier };
    if (path === `suppliers/${supplierId}/reviewBrief`)
      return {
        data: {
          supplier,
          snapshot: supplier.submissions[0],
          findings: [],
          changes: [],
          previousReturn: null,
          checkedAt: new Date().toISOString(),
          warningDays: 30,
        },
      };
    if (path === `suppliers/${supplierId}/return` && method === 'POST')
      return { data: { ...supplier, status: 'returned' } };
    return new Response(null, { status: 404 });
  });
  await renderWithApp(
    <Routes>
      <Route path='/suppliers/:id' element={<SupplierDetailPage />} />
    </Routes>,
    {
      route: `/suppliers/${supplierId}`,
      namespace: packageMetadata.name,
      namespaces: { [packageMetadata.name]: enUS },
      fetch: answerApi(api),
    },
  );
  const user = userEvent.setup();
  await user.type(
    await screen.findByRole('textbox', { name: enUS.suppliers.review.note }),
    'Please add the certificate',
  );
  await user.click(
    screen.getByRole('button', { name: enUS.suppliers.review.return }),
  );
  expect(
    screen.getByText(enUS.suppliers.review.confirmDescription, {
      exact: false,
    }),
  ).toBeInTheDocument();
  expect(
    api.mock.calls.some(
      ([call]: [ApiCall]) => call.path === `suppliers/${supplierId}/return`,
    ),
  ).toBe(false);
  await user.click(
    screen.getByRole('button', { name: enUS.suppliers.review.cancel }),
  );
  expect(
    api.mock.calls.some(
      ([call]: [ApiCall]) => call.path === `suppliers/${supplierId}/return`,
    ),
  ).toBe(false);
  await user.click(
    screen.getByRole('button', { name: enUS.suppliers.review.return }),
  );
  await user.click(
    screen.getByRole('button', { name: enUS.suppliers.review.confirm }),
  );
  await waitFor(() =>
    expect(
      api.mock.calls.filter(
        ([call]: [ApiCall]) => call.path === `suppliers/${supplierId}/return`,
      ),
    ).toHaveLength(1),
  );
});
