import { useApiClient, useSubmission } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useState, type ReactElement } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { FileList } from '#extensions/nocobase-file-component-ui/index';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '#components/ui/card';
import { Textarea } from '#components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';
import { useListData } from '#hooks/use-list-data';
import type { SupplierResponse } from './model.js';
import { ReviewAssistant } from './review-assistant.js';
import type { FileRecord } from '@nocobase/app-plugin-file/client';

export default function SupplierDetailPage(): ReactElement {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const api = useApiClient();
  const request = useListData<SupplierResponse>(`suppliers/${id}`, {
    active: Boolean(id),
  });
  const supplier = request.data?.data;
  const source = params.get('source');
  const search = params.get('search') ?? '';
  const page = params.get('page');
  const listParams = new URLSearchParams();
  if (search) listParams.set('search', search);
  if (page && /^\d+$/.test(page)) listParams.set('page', page);
  const listSuffix = listParams.size ? `?${listParams.toString()}` : '';
  const backPath =
    source === 'directory'
      ? `/supplier-directory${listSuffix}`
      : source === 'expiring'
        ? `/supplier-expiring${page && /^\d+$/.test(page) ? `?page=${page}` : ''}`
        : supplier?.canReview
          ? `/supplier-review${listSuffix}`
          : supplier?.ownerId
            ? '/supplier-application'
            : '/supplier-directory';
  const backTitle =
    source === 'directory'
      ? 'suppliers.directory.title'
      : source === 'expiring'
        ? 'suppliers.expiring.title'
        : supplier?.canReview
          ? 'suppliers.review.title'
          : supplier?.ownerId
            ? 'suppliers.my.title'
            : 'suppliers.directory.title';
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [confirmReturn, setConfirmReturn] = useState(false);
  const approval = useSubmission({ scope: `supplier:${id}:approve` });
  const returned = useSubmission({ scope: `supplier:${id}:return` });
  const decide = async (action: 'approve' | 'return') => {
    setMessage('');
    if (action === 'return' && !note.trim()) {
      setMessage(t('suppliers.review.reasonRequired'));
      return;
    }
    const submission = action === 'approve' ? approval : returned;
    try {
      if (action === 'return') {
        const current = await api.request<SupplierResponse>({
          path: `suppliers/${id}`,
        });
        if (
          current.data.version !== supplier?.version ||
          current.data.submissions?.[0]?.id !== supplier?.submissions?.[0]?.id
        ) {
          request.reload();
          setConfirmReturn(false);
          setMessage(t('suppliers.review.stale'));
          return;
        }
      }
      await submission.run(
        { action, id, note, expectedVersion: supplier?.version },
        async (key, signal, value) =>
          api.request<SupplierResponse>({
            path: `suppliers/${id}/${action}`,
            method: 'POST',
            json: { note: value.note, expectedVersion: value.expectedVersion },
            headers: { 'Idempotency-Key': key },
            signal,
          }),
      );
      request.reload();
      setConfirmReturn(false);
      setNote('');
      setMessage(t('suppliers.saved'));
    } catch {
      request.reload();
      setConfirmReturn(false);
      setMessage(t('suppliers.review.stale'));
    }
  };
  return (
    <PageContainer className='mx-auto max-w-5xl space-y-6'>
      <PageHeader
        title={supplier?.name ?? t('suppliers.detail.title')}
        actions={
          <Link to={backPath}>
            <Button variant='outline'>{t(backTitle)}</Button>
          </Link>
        }
      />
      {request.loading ? (
        <p>{t('suppliers.loading')}</p>
      ) : request.error || !supplier ? (
        <p role='alert'>{t('suppliers.loadFailed')}</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('suppliers.profile.title')}</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-3 text-sm sm:grid-cols-2'>
              <p>
                {t('suppliers.fields.creditCode')}: {supplier.creditCode}
              </p>
              <p>
                {t('suppliers.fields.category')}:{' '}
                {t(`suppliers.categories.${supplier.category}`)}
              </p>
              <p>
                {t('suppliers.fields.status')}:{' '}
                {t(`suppliers.status.${supplier.status}`)}
              </p>
              <p>
                {t('suppliers.fields.contactName')}: {supplier.contactName}
              </p>
              <p>
                {t('suppliers.fields.contactPhone')}: {supplier.contactPhone}
              </p>
              <p>
                {t('suppliers.fields.contactEmail')}: {supplier.contactEmail}
              </p>
              <p>
                {t('suppliers.fields.address')}: {supplier.address}
              </p>
              <p>
                {t('suppliers.fields.notes')}: {supplier.notes}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('suppliers.qualifications.title')}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {supplier.qualifications
                .filter((q) => q.stage !== 'archived')
                .map((q) => (
                  <div
                    key={q.id}
                    className='rounded-md border border-border p-3 text-sm'
                  >
                    <p className='font-medium'>
                      {q.typeCode} ·{' '}
                      {q.stage === 'current'
                        ? t('suppliers.qualifications.current')
                        : t('suppliers.qualifications.proposed')}
                    </p>
                    <p>
                      {t('suppliers.fields.certificateNumber')}:{' '}
                      {q.certificateNumber || '—'} ·{' '}
                      {t('suppliers.fields.validUntil')}: {q.validUntil}
                    </p>
                    {q.file && <FileList files={[q.file as FileRecord]} />}
                  </div>
                ))}
            </CardContent>
          </Card>
          {(supplier.canReview || supplier.ownerId) &&
            supplier.submissions?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t('suppliers.checklist.submissionRules')}
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 text-sm'>
                  {supplier.submissions.map((submission) => (
                    <section
                      key={submission.id}
                      className='space-y-2 rounded-md border border-border p-3'
                    >
                      <p className='font-medium'>
                        {submission.submittedAt} ·{' '}
                        {t(`suppliers.categories.${submission.category}`)}
                        {submission.source === 'migration-baseline'
                          ? ` · ${t('suppliers.checklist.legacyBaseline')}`
                          : ''}
                      </p>
                      {(submission.source === 'migration-baseline'
                        ? []
                        : submission.results
                      ).map((result) => (
                        <div
                          key={result.typeCode}
                          className='flex flex-wrap justify-between gap-2'
                        >
                          <span>
                            {result.typeCode === 'business-license'
                              ? t(
                                  'suppliers.qualificationTypes.businessLicense',
                                )
                              : result.name}
                            {' · '}
                            {result.required
                              ? t('suppliers.settings.required')
                              : t('suppliers.checklist.optional')}
                            {result.checkValidity
                              ? ` · ${t('suppliers.settings.checkValidity')}`
                              : ''}
                          </span>
                          <span>
                            {t(`suppliers.checklist.${result.status}`)}
                            {result.validUntil ? ` · ${result.validUntil}` : ''}
                          </span>
                        </div>
                      ))}
                    </section>
                  ))}
                </CardContent>
              </Card>
            )}
          {supplier.canReview &&
            ['pending', 'renewalPending'].includes(supplier.status) && (
              <ReviewAssistant id={id} onDraft={setNote} />
            )}
          {supplier.canReview &&
            ['pending', 'renewalPending'].includes(supplier.status) && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('suppliers.review.decision')}</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <Textarea
                    aria-label={t('suppliers.review.note')}
                    placeholder={t('suppliers.review.note')}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <div className='flex gap-2'>
                    <Button
                      onClick={() => void decide('approve')}
                      disabled={approval.submitting || returned.submitting}
                    >
                      {t('suppliers.review.approve')}
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => {
                        if (!note.trim())
                          setMessage(t('suppliers.review.reasonRequired'));
                        else setConfirmReturn(true);
                      }}
                      disabled={approval.submitting || returned.submitting}
                    >
                      {t('suppliers.review.return')}
                    </Button>
                  </div>
                  <AlertDialog
                    open={confirmReturn}
                    onOpenChange={setConfirmReturn}
                  >
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t('suppliers.review.confirmReturn')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {supplier.name} ·{' '}
                          {t('suppliers.review.confirmDescription')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <p className='whitespace-pre-wrap break-words text-sm'>
                        {note}
                      </p>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t('suppliers.review.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          disabled={returned.submitting}
                          onClick={() => void decide('return')}
                        >
                          {t('suppliers.review.confirm')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )}
          <Card>
            <CardHeader>
              <CardTitle>{t('suppliers.history')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2 text-sm'>
                {supplier.events.map((event) => (
                  <li key={event.id} className='border-b border-border pb-2'>
                    {t(`suppliers.actions.${event.action}`)} ·{' '}
                    {new Date(event.createdAt).toLocaleString()}
                    {event.note ? ` · ${event.note}` : ''}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          {message && <p role='status'>{message}</p>}
        </>
      )}
    </PageContainer>
  );
}
