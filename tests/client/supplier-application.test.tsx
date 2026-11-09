import { clientFileRepositoryManagerToken } from '@nocobase/app-plugin-file/client';
import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { expect, it, vi } from 'vitest';
import MySupplierPage from '../../client/pages/suppliers/my.js';
import enUS from '../../client/locales/en-US.js';
import packageMetadata from '../../package.json' with { type: 'json' };

it('loads the requirement checklist for the selected supplier category', async () => {
  const api = vi.fn(({ path }: ApiCall) => {
    if (path === 'suppliers/me')
      return {
        data: {
          supplier: null,
          reviewer: false,
          types: [
            {
              code: 'business-license',
              name: 'Business license',
              category: 'all',
              required: true,
              enabled: true,
            },
          ],
          rules: [
            {
              category: 'equipment',
              typeCode: 'business-license',
              name: 'Business license',
              required: true,
              checkValidity: true,
              enabled: true,
            },
          ],
        },
      };
    if (path === 'suppliers/me/checklist')
      return {
        data: [
          {
            typeCode: 'business-license',
            name: 'Business license',
            required: true,
            checkValidity: true,
            fileId: null,
            validUntil: null,
            status: 'missing',
          },
        ],
      };
    return new Response(null, { status: 404 });
  });
  await renderWithApp(
    <Routes>
      <Route path='/supplier-application' element={<MySupplierPage />} />
    </Routes>,
    {
      route: '/supplier-application',
      namespace: packageMetadata.name,
      namespaces: { [packageMetadata.name]: enUS },
      fetch: answerApi(api),
      services: (app) =>
        app.container.instance(clientFileRepositoryManagerToken, {
          repository: () => ({}),
        } as never),
    },
  );
  expect(
    await screen.findByText(enUS.suppliers.checklist.title),
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'suppliers/me/checklist',
        query: { category: 'equipment' },
      }),
    ),
  );
  expect(
    await screen.findByText(enUS.suppliers.checklist.missing),
  ).toBeInTheDocument();
  await userEvent.selectOptions(
    screen.getByLabelText(enUS.suppliers.fields.category),
    'service',
  );
  expect(api).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'suppliers/me/checklist',
      query: { category: 'service' },
    }),
  );
});
