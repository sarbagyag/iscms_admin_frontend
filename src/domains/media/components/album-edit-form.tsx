"use client";

import React, { useEffect, useState } from 'react';
import { Button, Column, FormGroup, Grid, InlineLoading, Toggle } from '@carbon/react';
import { Reset } from '@carbon/icons-react';
import { useAlbumStore } from '../stores/album-store';
import { useAddMediaToAlbum, useRemoveMediaFromAlbum, useReorderAlbum, useUpdateAlbum } from '../hooks/use-album-queries';
import type { Album } from '../types/album';
import { useTranslations } from 'next-intl';
import { TranslatableField } from '@/domains/sliders/components/translatable-field';

export const AlbumEditForm: React.FC<{ album: Album; onSuccess?: () => void }> = ({ album, onSuccess }) => {
  const { isSubmitting, setSubmitting, formStateById, updateFormField, resetFormState } = useAlbumStore();
  const formData = formStateById[album.id] ?? { name: album.name, description: album.description ?? { en: '', ne: '' }, isActive: album.isActive };
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const updateMutation = useUpdateAlbum();
  const addMedia = useAddMediaToAlbum();
  const removeMedia = useRemoveMediaFromAlbum();
  const reorder = useReorderAlbum();
  const t = useTranslations('media.albums');

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.en.trim() || !formData.name.ne.trim()) errors.name = t('form.validation.nameRequiredBoth');
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); e.stopPropagation(); submit(); };
    const container = document.getElementById('album-form');
    const form = container?.closest('form');
    if (form) { form.addEventListener('submit', handler); return () => form.removeEventListener('submit', handler); }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album.id, formData]);

  const submit = async () => {
    setSubmitting(true);
    if (!validate()) { setSubmitting(false); return; }
    try {
      await updateMutation.mutateAsync({ id: album.id, data: formData as any });
      setValidationErrors({});
      onSuccess?.();
    } catch (err) {
      // handled upstream
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
        <Button kind="ghost" size="sm" renderIcon={Reset} onClick={() => { resetFormState(album.id); setValidationErrors({}); }} disabled={isSubmitting}>{t('actions.reset')}</Button>
      </div>
      {isSubmitting && (
        <div style={{ marginBottom: '1rem' }}>
          <InlineLoading description={t('form.saving')} />
        </div>
      )}

      <Grid fullWidth>
        <Column lg={16} md={8} sm={4}>
          <FormGroup legendText={t('form.basicInfo')}>
            <TranslatableField label={t('form.nameEn') as any} value={formData.name} onChange={(val) => updateFormField(album.id, 'name', val)} />
            <div style={{ marginTop: '1rem' }}>
              <TranslatableField type="textarea" label={t('form.descriptionEn') as any} value={formData.description} onChange={(val) => updateFormField(album.id, 'description', val)} />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Toggle id="album-isActive" labelText={t('form.isActive')} toggled={formData.isActive} onToggle={(checked) => updateFormField(album.id, 'isActive', checked)} />
            </div>
          </FormGroup>
        </Column>
      </Grid>

      {/* Future panels: manage cover image, add/remove media, drag sort */}
    </div>
  );
};


