import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
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
import { SupplierExpiryBadge } from './expiry-badge.js';

interface ExpiringRow {
  id: string;
  supplierId: string;
  supplierName: string;
  typeCode: string;
  validUntil: string;
  expiryState: 'expired' | 'expiring';
}
export default function SupplierExpiringPage(): ReactElement {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? '1') || 1;
  const request = useListData<{ data: ExpiringRow[] }>(
    `suppliers/expiring?page=${page}`,
  );
  return (
    <PageContainer className='space-y-6'>
      <PageHeader
        title={t('suppliers.expiring.title')}
        description={t('suppliers.expiring.description')}
      />
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
                <TableHead>{t('suppliers.fields.type')}</TableHead>
                <TableHead>{t('suppliers.fields.validUntil')}</TableHead>
                <TableHead>{t('suppliers.fields.expiryState')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {request.data.data.map((row) => (
                <TableRow
                  key={row.id}
                  className={
                    row.expiryState === 'expired'
                      ? 'bg-destructive/5 hover:bg-destructive/10'
                      : 'bg-(--status-warning-background)/50 hover:bg-(--status-warning-background)'
                  }
                >
                  <TableCell>
                    <Link
                      className='font-medium text-primary hover:underline'
                      to={`/suppliers/${row.supplierId}?source=expiring&page=${page}`}
                    >
                      {row.supplierName}
                    </Link>
                  </TableCell>
                  <TableCell>{row.typeCode}</TableCell>
                  <TableCell>
                    <span
                      className={
                        row.expiryState === 'expired'
                          ? 'font-semibold tabular-nums text-destructive'
                          : 'font-semibold tabular-nums text-(--status-warning)'
                      }
                    >
                      {row.validUntil}
                    </span>
                  </TableCell>
                  <TableCell>
                    <SupplierExpiryBadge state={row.expiryState} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className='rounded-md border border-border p-6 text-muted-foreground'>
          {t('suppliers.expiring.empty')}
        </p>
      )}
      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          disabled={page <= 1}
          onClick={() => setParams({ page: String(page - 1) })}
        >
          {t('suppliers.previous')}
        </Button>
        <span className='text-sm text-muted-foreground'>{page}</span>
        <Button
          variant='outline'
          disabled={(request.data?.data.length ?? 0) < 20}
          onClick={() => setParams({ page: String(page + 1) })}
        >
          {t('suppliers.next')}
        </Button>
      </div>
    </PageContainer>
  );
}
