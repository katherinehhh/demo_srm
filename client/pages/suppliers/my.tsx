import {
  createUuid,
  useApiClient,
  useService,
  useSubmission,
} from '@nocobase/app-client';
import {
  clientFileRepositoryManagerToken,
  type FileRecord,
} from '@nocobase/app-plugin-file/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { Link } from 'react-router';
import {
  FileUploadField,
  FileList,
} from '#extensions/nocobase-file-component-ui/index';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '#components/ui/card';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import { useListData } from '#hooks/use-list-data';
import type {
  SupplierMyResponse,
  SupplierResponse,
  SupplierFile,
  QualificationType,
  AdmissionResult,
} from './model.js';

const initial: {
  name: string;
  creditCode: string;
  category: 'equipment' | 'service' | 'both';
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  notes: string;
} = {
  name: '',
  creditCode: '',
  category: 'equipment',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  address: '',
  notes: '',
};
type Draft = {
  clientId: string;
  typeCode: string;
  certificateNumber: string;
  validUntil: string;
  file: SupplierFile | null;
};
const emptyDraft = (): Draft => ({
  clientId: createUuid(),
  typeCode: 'business-license',
  certificateNumber: '',
  validUntil: '',
  file: null,
});

export default function MySupplierPage(): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const manager = useService(clientFileRepositoryManagerToken);
  const files = useMemo(() => manager.repository('supplierFiles'), [manager]);
  const request = useListData<SupplierMyResponse>('suppliers/me');
  const supplier = request.data?.data.supplier;
  const reviewer = request.data?.data.reviewer;
  const types = request.data?.data.types ?? [];
  const rules = request.data?.data.rules ?? [];
  const [profile, setProfile] = useState<typeof initial>(initial);
  const checklist = useListData<{ data: AdmissionResult[] }>(
    `suppliers/me/checklist?category=${profile.category}`,
  );
  const [drafts, setDrafts] = useState<Draft[]>(() => [emptyDraft()]);
  const [message, setMessage] = useState('');
  const [busyUpload, setBusyUpload] = useState(false);
  const profileSubmission = useSubmission({ scope: 'supplier:profile' });
  const qualificationSubmission = useSubmission({
    scope: 'supplier:qualifications',
  });
  const submitSubmission = useSubmission({ scope: 'supplier:submit' });
  useEffect(() => {
    if (!supplier) return;
    const updatedProfile = {
      name: supplier.name,
      creditCode: supplier.creditCode,
      category: supplier.category,
      contactName: supplier.contactName,
      contactPhone: supplier.contactPhone,
      contactEmail: supplier.contactEmail,
      address: supplier.address ?? '',
      notes: supplier.notes ?? '',
    };
    const proposed = supplier.qualifications.filter(
      (q) => q.stage === 'proposed',
    );
    const updatedDrafts = proposed.length
      ? proposed.map((q) => ({
          clientId: q.id,
          typeCode: q.typeCode,
          certificateNumber: q.certificateNumber ?? '',
          validUntil: q.validUntil ?? '',
          file: q.file,
        }))
      : [emptyDraft()];
    queueMicrotask(() => {
      setProfile(updatedProfile);
      setDrafts(updatedDrafts);
    });
  }, [supplier]);
  const editable = !supplier || ['draft', 'returned'].includes(supplier.status);
  const canRenew =
    supplier && ['approved', 'renewalReturned'].includes(supplier.status);
  const canEditQualifications = editable || canRenew;
  const setField = (key: keyof typeof initial, value: string) =>
    setProfile((old) => ({ ...old, [key]: value }));
  const typeName = (code: string) =>
    code === 'business-license'
      ? t('suppliers.qualificationTypes.businessLicense')
      : (types.find((type) => type.code === code)?.name ?? code);
  const applicableRules = rules.filter(
    (rule) => rule.enabled && rule.category === profile.category,
  );
  const applicableTypes = types.filter((type) =>
    applicableRules.some((rule) => rule.typeCode === type.code),
  );
  const visibleChecklist = checklist.data?.data.map((item) => {
    if (!canEditQualifications || supplier?.category !== profile.category)
      return item;
    const draft = drafts.find(
      (row) => row.typeCode === item.typeCode && row.file,
    );
    if (!draft)
      return {
        ...item,
        status: item.required ? ('missing' as const) : ('notProvided' as const),
      };
    if (item.checkValidity && !draft.validUntil)
      return { ...item, status: 'dateMissing' as const };
    if (
      item.checkValidity &&
      draft.validUntil < new Date().toISOString().slice(0, 10)
    )
      return { ...item, status: 'expired' as const };
    return { ...item, status: 'complete' as const };
  });
  const saveProfile = async () => {
    setMessage('');
    try {
      await profileSubmission.run(profile, async (key, signal, value) =>
        api.request<SupplierResponse>({
          path: 'suppliers/me',
          method: 'PUT',
          json: value,
          headers: { 'Idempotency-Key': key },
          signal,
        }),
      );
      request.reload();
      checklist.reload();
      setMessage(t('suppliers.saved'));
    } catch {
      setMessage(t('suppliers.saveFailed'));
    }
  };
  const saveQualifications = async () => {
    setMessage('');
    const values = drafts
      .filter((row) => row.typeCode || row.file)
      .map((row) => ({
        typeCode: row.typeCode,
        certificateNumber: row.certificateNumber,
        validUntil: row.validUntil || null,
        fileId: row.file?.id ?? '',
      }));
    if (
      values.some(
        (row) =>
          !row.typeCode ||
          !row.fileId ||
          (applicableRules.find((rule) => rule.typeCode === row.typeCode)
            ?.checkValidity &&
            !row.validUntil),
      )
    ) {
      setMessage(t('suppliers.completeQualification'));
      return;
    }
    try {
      await qualificationSubmission.run(values, async (key, signal, value) =>
        api.request<SupplierResponse>({
          path: 'suppliers/me/qualifications',
          method: 'PUT',
          json: value,
          headers: { 'Idempotency-Key': key },
          signal,
        }),
      );
      request.reload();
      checklist.reload();
      setMessage(t('suppliers.saved'));
    } catch {
      setMessage(t('suppliers.saveFailed'));
    }
  };
  const submit = async () => {
    setMessage('');
    try {
      await submitSubmission.run(
        { supplierId: supplier?.id },
        async (key, signal) =>
          api.request<SupplierResponse>({
            path: 'suppliers/me/submit',
            method: 'POST',
            headers: { 'Idempotency-Key': key },
            signal,
          }),
      );
      request.reload();
      setMessage(t('suppliers.submitted'));
    } catch {
      checklist.reload();
      setMessage(t('suppliers.submitFailed'));
    }
  };
  return (
    <PageContainer className='mx-auto max-w-5xl space-y-6'>
      <PageHeader
        title={t('suppliers.my.title')}
        description={t('suppliers.my.description')}
        actions={
          reviewer ? (
            <Link to='/supplier-review'>
              <Button variant='outline'>{t('suppliers.review.title')}</Button>
            </Link>
          ) : undefined
        }
      />
      {request.loading ? (
        <p>{t('suppliers.loading')}</p>
      ) : request.error ? (
        <p role='alert'>{t('suppliers.loadFailed')}</p>
      ) : (
        <>
          {supplier && (
            <p className='rounded-md border border-border bg-card p-3 text-sm'>
              {t(`suppliers.status.${supplier.status}`)}
              {supplier.reviewNote ? ` · ${supplier.reviewNote}` : ''}
            </p>
          )}
          <Card>
            <CardHeader>
              <CardTitle>{t('suppliers.profile.title')}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-2'>
                {(
                  [
                    'name',
                    'creditCode',
                    'contactName',
                    'contactPhone',
                    'contactEmail',
                    'address',
                  ] as const
                ).map((key) => (
                  <label key={key} className='space-y-1 text-sm'>
                    <span>{t(`suppliers.fields.${key}`)}</span>
                    <Input
                      value={profile[key]}
                      disabled={!editable}
                      onChange={(e) => setField(key, e.target.value)}
                    />
                  </label>
                ))}
                <label className='space-y-1 text-sm'>
                  <span>{t('suppliers.fields.category')}</span>
                  <select
                    className='flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm'
                    disabled={!editable}
                    value={profile.category}
                    onChange={(e) => setField('category', e.target.value)}
                  >
                    <option value='equipment'>
                      {t('suppliers.categories.equipment')}
                    </option>
                    <option value='service'>
                      {t('suppliers.categories.service')}
                    </option>
                    <option value='both'>
                      {t('suppliers.categories.both')}
                    </option>
                  </select>
                </label>
              </div>
              <label className='block space-y-1 text-sm'>
                <span>{t('suppliers.fields.notes')}</span>
                <Textarea
                  value={profile.notes}
                  disabled={!editable}
                  onChange={(e) => setField('notes', e.target.value)}
                />
              </label>
              {editable && (
                <Button
                  onClick={() => void saveProfile()}
                  disabled={profileSubmission.submitting}
                >
                  {t('suppliers.saveProfile')}
                </Button>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('suppliers.checklist.title')}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2 text-sm'>
              {checklist.loading ? (
                <p>{t('suppliers.loading')}</p>
              ) : checklist.error ? (
                <p role='alert'>{t('suppliers.loadFailed')}</p>
              ) : (
                visibleChecklist?.map((item) => (
                  <div
                    key={item.typeCode}
                    className='flex flex-wrap justify-between gap-2 rounded-md border border-border p-3'
                  >
                    <span>
                      {item.typeCode === 'business-license'
                        ? t('suppliers.qualificationTypes.businessLicense')
                        : item.name}
                      {' · '}
                      {item.required
                        ? t('suppliers.settings.required')
                        : t('suppliers.checklist.optional')}
                      {item.checkValidity
                        ? ` · ${t('suppliers.settings.checkValidity')}`
                        : ''}
                    </span>
                    <span>{t(`suppliers.checklist.${item.status}`)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          {supplier && (
            <Card>
              <CardHeader>
                <CardTitle>{t('suppliers.qualifications.title')}</CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                {supplier.qualifications.some((q) => q.stage === 'current') && (
                  <section className='space-y-2'>
                    <h3 className='font-medium'>
                      {t('suppliers.qualifications.current')}
                    </h3>
                    {supplier.qualifications
                      .filter((q) => q.stage === 'current')
                      .map((q) => (
                        <div
                          key={q.id}
                          className='rounded-md border border-border p-3 text-sm'
                        >
                          <p>
                            {typeName(q.typeCode)} · {q.validUntil}
                          </p>
                          {q.file && (
                            <FileList files={[q.file as FileRecord]} />
                          )}
                        </div>
                      ))}
                  </section>
                )}
                {canEditQualifications && (
                  <section className='space-y-4'>
                    <h3 className='font-medium'>
                      {canRenew
                        ? t('suppliers.qualifications.renewal')
                        : t('suppliers.qualifications.proposed')}
                    </h3>
                    {drafts.map((row, index) => (
                      <div
                        key={row.clientId}
                        className='space-y-3 rounded-md border border-border p-4'
                      >
                        <div className='grid gap-3 sm:grid-cols-3'>
                          <label className='space-y-1 text-sm'>
                            <span>{t('suppliers.fields.type')}</span>
                            <select
                              className='flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm'
                              value={row.typeCode}
                              onChange={(e) =>
                                setDrafts((old) =>
                                  old.map((item, i) =>
                                    i === index
                                      ? { ...item, typeCode: e.target.value }
                                      : item,
                                  ),
                                )
                              }
                            >
                              {applicableTypes.map(
                                (type: QualificationType) => (
                                  <option key={type.code} value={type.code}>
                                    {typeName(type.code)}
                                    {applicableRules.find(
                                      (rule) => rule.typeCode === type.code,
                                    )?.required
                                      ? ' *'
                                      : ''}
                                  </option>
                                ),
                              )}
                            </select>
                          </label>
                          <label className='space-y-1 text-sm'>
                            <span>
                              {t('suppliers.fields.certificateNumber')}
                            </span>
                            <Input
                              value={row.certificateNumber}
                              onChange={(e) =>
                                setDrafts((old) =>
                                  old.map((item, i) =>
                                    i === index
                                      ? {
                                          ...item,
                                          certificateNumber: e.target.value,
                                        }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </label>
                          <label className='space-y-1 text-sm'>
                            <span>{t('suppliers.fields.validUntil')}</span>
                            <Input
                              type='date'
                              value={row.validUntil}
                              onChange={(e) =>
                                setDrafts((old) =>
                                  old.map((item, i) =>
                                    i === index
                                      ? { ...item, validUntil: e.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </label>
                        </div>
                        <FileUploadField
                          repository={files}
                          value={row.file ? [row.file as FileRecord] : []}
                          onChange={(value) =>
                            setDrafts((old) =>
                              old.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      file: (value[0] as SupplierFile) ?? null,
                                    }
                                  : item,
                              ),
                            )
                          }
                          onStatusChange={(status) =>
                            setBusyUpload(status !== 'idle')
                          }
                        />
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            setDrafts((old) =>
                              old.filter((_, i) => i !== index),
                            )
                          }
                        >
                          {t('suppliers.remove')}
                        </Button>
                      </div>
                    ))}
                    <div className='flex flex-wrap gap-2'>
                      <Button
                        variant='outline'
                        onClick={() =>
                          setDrafts((old) => [...old, emptyDraft()])
                        }
                      >
                        {t('suppliers.addQualification')}
                      </Button>
                      <Button
                        variant='outline'
                        onClick={() => void saveQualifications()}
                        disabled={
                          qualificationSubmission.submitting || busyUpload
                        }
                      >
                        {t('suppliers.saveQualifications')}
                      </Button>
                      <Button
                        onClick={() => void submit()}
                        disabled={submitSubmission.submitting || busyUpload}
                      >
                        {canRenew
                          ? t('suppliers.submitRenewal')
                          : t('suppliers.submit')}
                      </Button>
                    </div>
                  </section>
                )}
              </CardContent>
            </Card>
          )}
          {supplier && supplier.events.length > 0 && (
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
          )}
          {message && (
            <p role='status' className='text-sm'>
              {message}
            </p>
          )}
        </>
      )}
    </PageContainer>
  );
}
