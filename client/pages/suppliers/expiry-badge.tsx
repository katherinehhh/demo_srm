import type { ReactElement } from 'react';
import { CircleX, TriangleAlert } from 'lucide-react';
import { useTranslation } from '@nocobase/i18n/client';
import { StatusBadge } from '#components/status-badge';
import { Badge } from '#components/ui/badge';

export function SupplierExpiryBadge({
  state,
}: {
  state: 'valid' | 'expiring' | 'expired';
}): ReactElement {
  const { t } = useTranslation();
  if (state === 'expired')
    return (
      <Badge variant='destructive'>
        <CircleX aria-hidden='true' />
        {t('suppliers.expiry.expired')}
      </Badge>
    );
  if (state === 'expiring')
    return (
      <StatusBadge tone='warning'>
        <TriangleAlert aria-hidden='true' />
        {t('suppliers.expiry.expiring')}
      </StatusBadge>
    );
  return (
    <StatusBadge tone='success'>{t('suppliers.expiry.valid')}</StatusBadge>
  );
}
