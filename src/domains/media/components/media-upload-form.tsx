"use client";

import React, { useEffect, useState } from 'react';
import { Button, Column, Dropdown, FormGroup, Grid, InlineLoading, TextArea, TextInput, Toggle } from '@carbon/react';
import { Reset } from '@carbon/icons-react';
import { useMediaStore } from '../stores/media-store';
import { useBulkUploadMedia, useUploadMedia } from '../hooks/use-media-queries';
import { useTranslations } from 'next-intl';
import { MediaMultiUpload } from './media-multi-upload';
import { TranslatableField } from '@/domains/sliders/components/translatable-field';

export const MediaUploadForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { isSubmitting, setSubmitting, createFormState, updateFormField, resetFormState, createSelectedFile, setSelectedFile } = useMediaStore();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const upload = useUploadMedia();
  const bulkUpload = useBulkUploadMedia();
  const [files, setFiles] = useState<File[]>([]);
  const t = useTranslations('media');

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!files.length) errors.file = t('form.validation.fileRequired');
    if (!createFormState.folder) errors.folder = t('form.validation.folderRequired');
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      submit();
    };
    const container = document.getElementById('media-form');
    const form = container?.closest('form');
    if (form) {
      form.addEventListener('submit', handler);
      return () => form.removeEventListener('submit', handler);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createFormState, files]);

  const submit = async () => {
    setSubmitting(true);
    if (!validate()) {
      setSubmitting(false);
      return;
    }
    try {
      if (files.length === 1) {
        const [single] = files;
        await upload.mutateAsync({ file: single as File, form: createFormState as any });
      } else {
        await bulkUpload.mutateAsync({ files, form: createFormState as any });
      }
      resetFormState('create');
      setValidationErrors({});
      onSuccess?.();
    } catch (err) {
      // handled by notifications layer
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
        <Button kind="ghost" size="sm" renderIcon={Reset} onClick={() => { resetFormState('create'); setFiles([]); setValidationErrors({}); }} disabled={isSubmitting}>
          {t('actions.reset')}
        </Button>
      </div>
      {isSubmitting && (
        <div style={{ marginBottom: '1rem' }}>
          <InlineLoading description={t('form.saving')} />
        </div>
      )}

      <Grid fullWidth>
        <Column lg={16} md={8} sm={4}>
          <FormGroup legendText={t('form.files')}>
            <MediaMultiUpload files={files} onFilesChange={setFiles} isUploading={isSubmitting || upload.isPending || bulkUpload.isPending} />
            {validationErrors.file && <div className="cds--form-requirement">{validationErrors.file}</div>}
          </FormGroup>

          <FormGroup legendText={t('form.details')}>
            <TranslatableField label={t('form.title') as any} value={createFormState.title || { en: '', ne: '' }} onChange={(val) => updateFormField('create', 'title', val)} />
            <div style={{ marginTop: '1rem' }}>
              <TranslatableField type="textarea" label={t('form.description') as any} value={createFormState.description || { en: '', ne: '' }} onChange={(val) => updateFormField('create', 'description', val)} />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <TranslatableField label={t('form.altText') as any} value={createFormState.altText || { en: '', ne: '' }} onChange={(val) => updateFormField('create', 'altText', val)} />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <TextInput id="media-tags" labelText={t('form.tags')} value={createFormState.tags.join(', ')} onChange={(e) => updateFormField('create', 'tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))} />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Dropdown
                id="media-folder"
                items={['sliders', 'office-settings', 'users', 'content', 'documents', 'reports', 'videos', 'audio', 'general'].map((f) => ({ id: f, label: f }))}
                itemToString={(i) => (i ? i.label : '')}
                selectedItem={{ id: createFormState.folder, label: createFormState.folder }}
                onChange={({ selectedItem }) => updateFormField('create', 'folder', selectedItem?.id || 'general')}
                label={t('form.folder')}
                titleText={t('form.folder')}
                invalid={!!validationErrors.folder}
                invalidText={validationErrors.folder}
              />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Toggle id="media-isPublic" labelText={t('form.isPublic')} toggled={createFormState.isPublic} onToggle={(checked) => updateFormField('create', 'isPublic', checked)} />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Toggle id="media-isActive" labelText={t('form.isActive')} toggled={createFormState.isActive} onToggle={(checked) => updateFormField('create', 'isActive', checked)} />
            </div>
          </FormGroup>
        </Column>
      </Grid>
    </div>
  );
};


