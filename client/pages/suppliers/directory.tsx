import { useTranslation } from '@nocobase/i18n/client';
import { useState, type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Input } from '#components/ui/input';
import { Button } from '#components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import { useListData } from '#hooks/use-list-data';
import type { Supplier } from './model.js';

export default function SupplierDirectoryPage(): ReactElement {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const page = Number(params.get('page') ?? '1') || 1;
  const [draftSearch, setDraftSearch] = useState(search);
  const request = useListData<{ data: Supplier[] }>(
    `suppliers/directory?search=${encodeURIComponent(search)}&page=${page}`,
  );
  return (
    <PageContainer className='space-y-6'>
      <PageHeader
        title={t('suppliers.directory.title')}
        description={t('suppliers.directory.description')}
      />
      <form
        className='flex flex-wrap gap-2'
        onSubmit={(event) => {
          event.preventDefault();
          setParams(
            draftSearch ? { search: draftSearch, page: '1' } : { page: '1' },
            {
              replace: true,
            },
          );
        }}
      >
        <Input
          aria-label={t('suppliers.search')}
          placeholder={t('suppliers.search')}
          value={draftSearch}
          onChange={(event) => setDraftSearch(event.target.value)}
          className='max-w-sm'
        />
        <Button type='submit' variant='outline'>
          {t('suppliers.searchAction')}
        </Button>
      </form>
      {request.loading ? (
        <p>{t('suppliers.loading')}</p>
      ) : request.error ? (
        <p role='alert'>{t('suppliers.loadFailed')}</p>
      ) : request.data?.data.length ? (
        <div className='overflow-x-auto rounded-md border border-border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('suppliers.fields.name')}</TableHead>
                <TableHead>{t('suppliers.fields.creditCode')}</TableHead>
                <TableHead>{t('suppliers.fields.category')}</TableHead>
                <TableHead>{t('suppliers.fields.expiryState')}</TableHead>
                <TableHead>{t('suppliers.fields.contactName')}</TableHead>
                <TableHead>{t('suppliers.fields.contactPhone')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {request.data.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      className='font-medium text-primary hover:underline'
                      to={`/suppliers/${row.id}?source=directory&search=${encodeURIComponent(search)}&page=${page}`}
                    >
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell>{row.creditCode}</TableCell>
                  <TableCell>
                    {t(`suppliers.categories.${row.category}`)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        row.expiryState === 'valid'
                          ? 'text-muted-foreground'
                          : 'font-medium text-destructive'
                      }
                    >
                      {t(`suppliers.expiry.${row.expiryState ?? 'valid'}`)}
                    </span>
                  </TableCell>
                  <TableCell>{row.contactName}</TableCell>
                  <TableCell>{row.contactPhone}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className='rounded-md border border-border p-6 text-muted-foreground'>
          {t('suppliers.directory.empty')}
        </p>
      )}
      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          disabled={page <= 1}
          onClick={() => setParams({ search, page: String(page - 1) })}
        >
          {t('suppliers.previous')}
        </Button>
        <span className='text-sm text-muted-foreground'>{page}</span>
        <Button
          variant='outline'
          disabled={(request.data?.data.length ?? 0) < 20}
          onClick={() => setParams({ search, page: String(page + 1) })}
        >
          {t('suppliers.next')}
        </Button>
      </div>
    </PageContainer>
  );
}
