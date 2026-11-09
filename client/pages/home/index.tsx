import { type ReactElement } from 'react';
import { Link } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import {
  Building2,
  BookOpenCheck,
  CalendarClock,
  ClipboardCheck,
} from 'lucide-react';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '#components/ui/card';
import { useListData } from '#hooks/use-list-data';
import type { SupplierMyResponse } from '../suppliers/model.js';

export default function HomePage(): ReactElement {
  const { t } = useTranslation();
  const mine = useListData<SupplierMyResponse>('suppliers/me');
  const reviewer = mine.data?.data.reviewer;
  const cards = [
    {
      path: '/supplier-application',
      icon: Building2,
      title: 'suppliers.my.title',
      description: 'suppliers.my.description',
    },
    ...(reviewer
      ? [
          {
            path: '/supplier-review',
            icon: ClipboardCheck,
            title: 'suppliers.review.title',
            description: 'suppliers.review.description',
          },
        ]
      : []),
    ...(reviewer
      ? [
          {
            path: '/supplier-directory',
            icon: BookOpenCheck,
            title: 'suppliers.directory.title',
            description: 'suppliers.directory.description',
          },
        ]
      : []),
    ...(reviewer
      ? [
          {
            path: '/supplier-expiring',
            icon: CalendarClock,
            title: 'suppliers.expiring.title',
            description: 'suppliers.expiring.description',
          },
        ]
      : []),
  ];
  return (
    <PageContainer className='mx-auto max-w-6xl space-y-6'>
      <PageHeader
        title={t('suppliers.home.title')}
        description={t('suppliers.home.description')}
      />
      <div className='grid gap-4 md:grid-cols-2'>
        {cards.map(({ path, icon: Icon, title, description }) => (
          <Card key={path}>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Icon className='size-5 text-primary' />
                {t(title)}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p className='text-sm text-muted-foreground'>{t(description)}</p>
              <Link to={path}>
                <Button variant='outline'>{t('suppliers.home.open')}</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
