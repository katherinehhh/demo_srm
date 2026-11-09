import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useState, type ReactElement } from 'react';
import { Button } from '#components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '#components/ui/card';
import { FileList } from '#extensions/nocobase-file-component-ui/index';
import { useListData } from '#hooks/use-list-data';
import type { FileRecord } from '@nocobase/app-plugin-file/client';
import type { ReviewBrief } from './model.js';

export function ReviewAssistant({
  id,
  onDraft,
}: {
  id: string;
  onDraft: (text: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const report = useListData<{ data: ReviewBrief }>(
    `suppliers/${id}/reviewBrief`,
  );
  const brief = report.data?.data;
  const [busy, setBusy] = useState<'risks' | 'draft' | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const generate = async (mode: 'risks' | 'draft') => {
    setBusy(mode);
    setUnavailable(false);
    try {
      const response = await api.request<{
        data: {
          available: boolean;
          text: string | null;
          version: number;
          snapshotId: string;
        };
      }>({
        path: `suppliers/${id}/aiReview`,
        method: 'POST',
        json: { mode },
      });
      const result = response.data;
      if (
        !result.available ||
        !result.text ||
        !brief ||
        result.version !== brief.supplier.version ||
        result.snapshotId !== brief.snapshot.id
      ) {
        setUnavailable(true);
        report.reload();
      } else if (mode === 'draft') {
        onDraft(result.text);
      } else {
        setSuggestion(result.text);
      }
    } catch {
      setUnavailable(true);
    } finally {
      setBusy(null);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('suppliers.ai.title')}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 text-sm'>
        {report.loading ? (
          <p>{t('suppliers.loading')}</p>
        ) : report.error || !brief ? (
          <p role='alert'>{t('suppliers.ai.loadFailed')}</p>
        ) : (
          <>
            <p className='text-muted-foreground'>
              {t('suppliers.ai.description')}
            </p>
            <p>
              {t('suppliers.ai.checkedAt')}:{' '}
              {new Date(brief.checkedAt).toLocaleString()}
            </p>
            <div className='space-y-2'>
              {brief.findings.map((finding) => (
                <div
                  key={finding.typeCode}
                  className='rounded-md border border-border p-3'
                >
                  <p className='font-medium'>
                    {finding.name} ·{' '}
                    {t(`suppliers.checklist.${finding.status}`)}
                    {finding.severity === 'warning'
                      ? ` · ${t('suppliers.ai.expiring')}`
                      : ''}
                  </p>
                  <p className='text-muted-foreground'>
                    {finding.required
                      ? t('suppliers.settings.required')
                      : t('suppliers.checklist.optional')}
                    {finding.checkValidity
                      ? ` · ${t('suppliers.settings.checkValidity')}`
                      : ''}
                    {finding.validUntil ? ` · ${finding.validUntil}` : ''}
                  </p>
                  <details className='mt-2'>
                    <summary className='cursor-pointer'>
                      {t('suppliers.ai.evidence')}
                    </summary>
                    <div className='mt-2 space-y-1 break-all'>
                      <p>
                        {t('suppliers.ai.snapshot')}:{' '}
                        {finding.evidence.snapshotId} ·{' '}
                        {new Date(
                          finding.evidence.submittedAt,
                        ).toLocaleString()}
                      </p>
                      {finding.qualificationId && (
                        <p>
                          {t('suppliers.ai.qualification')}:{' '}
                          {finding.qualificationId}
                        </p>
                      )}
                      {finding.file && (
                        <FileList files={[finding.file as FileRecord]} />
                      )}
                      <p>{t('suppliers.ai.contentUnverified')}</p>
                    </div>
                  </details>
                </div>
              ))}
            </div>
            <section className='space-y-2'>
              <h3 className='font-medium'>
                {t('suppliers.ai.previousReturn')}
              </h3>
              {brief.previousReturn ? (
                <>
                  <p>
                    {new Date(brief.previousReturn.createdAt).toLocaleString()}{' '}
                    · {brief.previousReturn.note}
                  </p>
                  <details>
                    <summary className='cursor-pointer'>
                      {t('suppliers.ai.evidence')}
                    </summary>
                    <p className='break-all'>
                      {t('suppliers.ai.returnEvent')}: {brief.previousReturn.id}
                    </p>
                  </details>
                  <ul className='space-y-1'>
                    {brief.changes.map((change) => (
                      <li key={change.typeCode}>
                        {change.name}: {t(`suppliers.ai.${change.outcome}`)}
                        {change.changed
                          ? ` · ${t('suppliers.ai.materialChanged')}`
                          : ''}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className='text-muted-foreground'>
                  {t('suppliers.ai.noPreviousReturn')}
                </p>
              )}
            </section>
            <div className='flex flex-wrap gap-2'>
              <Button
                variant='outline'
                disabled={busy !== null}
                onClick={() => report.reload()}
              >
                {t('suppliers.ai.refresh')}
              </Button>
              <Button
                variant='outline'
                disabled={busy !== null}
                onClick={() => void generate('risks')}
              >
                {t('suppliers.ai.analyze')}
              </Button>
              <Button
                variant='outline'
                disabled={busy !== null}
                onClick={() => void generate('draft')}
              >
                {t('suppliers.ai.draft')}
              </Button>
            </div>
            {busy && <p role='status'>{t('suppliers.ai.generating')}</p>}
            {unavailable && <p role='alert'>{t('suppliers.ai.unavailable')}</p>}
            {suggestion && (
              <div className='whitespace-pre-wrap rounded-md border border-border p-3'>
                <h3 className='mb-2 font-medium'>
                  {t('suppliers.ai.suggestion')}
                </h3>
                {suggestion}
                <p className='mt-2 text-muted-foreground'>
                  {t('suppliers.ai.advisory')}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
