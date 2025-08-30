"use client";

import React, { useEffect, useState } from 'react';
import { Button, Column, Dropdown, FormGroup, Grid, InlineLoading, TextArea, TextInput, Toggle } from '@carbon/react';
import { useTranslations } from 'next-intl';
import { Reset, Image as ImageIcon } from '@carbon/icons-react';
import { useMediaStore } from '../stores/media-store';
import { useUpdateMedia } from '../hooks/use-media-queries';
import { TranslatableField } from '@/domains/sliders/components/translatable-field';
// no file upload in edit mode
import type { Media } from '../types/media';
import MediaUrlService from '@/services/media-url-service';
import { mediaRepository } from '../repositories/media-repository';

export const MediaEditForm: React.FC<{ media: Media; onSuccess?: () => void }> = ({ media, onSuccess }) => {
  const { isSubmitting, setSubmitting, formStateById, updateFormField, resetFormState } = useMediaStore();
  const formData = formStateById[media.id] ?? {
    title: { en: media.title ?? '', ne: '' },
    description: { en: media.description ?? '', ne: '' },
    altText: { en: media.altText ?? '', ne: '' },
    tags: [...(media.tags ?? [])],
    folder: media.folder,
    isPublic: !!media.isPublic,
    isActive: !!media.isActive,
  };
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const updateMutation = useUpdateMedia();
  const t = useTranslations('media');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.folder) errors.folder = t('form.validation.folderRequired');
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    // Resolve preview image: prefer existing presigned/url; fallback to fresh presigned URL
    let mounted = true;
    const existing = media.presignedUrl || media.url || '';
    const setIfMounted = (u: string | null) => { if (mounted) setImageUrl(u ? MediaUrlService.toProxyUrl(u) : null); };
    if (existing) {
      setIfMounted(existing);
    } else {
      setIsPreviewLoading(true);
      mediaRepository.getPresignedUrl(media.id).then((res) => {
        setIfMounted(res?.presignedUrl || null);
      }).catch(() => {
        setIfMounted(null);
      }).finally(() => {
        if (mounted) setIsPreviewLoading(false);
      });
    }

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
  }, [media.id, media.presignedUrl, media.url, formData]);

  const submit = async () => {
    setSubmitting(true);
    if (!validate()) {
      setSubmitting(false);
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: media.id, data: formData as any });
      setValidationErrors({});
      onSuccess?.();
    } catch (err) {
      // handled upstream
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
        <Button kind="ghost" size="sm" renderIcon={Reset} onClick={() => { resetFormState(media.id); setValidationErrors({}); }} disabled={isSubmitting}>
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
          {/* Read-only current file preview */}
          <div className="media-edit-preview" style={{ marginBottom: '1rem' }}>
            <div className="card-image" style={{ height: 180 }}>
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={formData.altText?.en || media.originalName} className="preview-image" />
              ) : (
                <div className="media-card__placeholder">
                  <ImageIcon size={24} />
                </div>
              )}
            </div>
          </div>

          <FormGroup legendText={t('form.details')}>
            <TranslatableField label={t('form.title') as any} value={formData.title as any} onChange={(val) => updateFormField(media.id, 'title', val)} />
            <div style={{ marginTop: '1rem' }}>
              <TranslatableField type="textarea" label={t('form.description') as any} value={formData.description as any} onChange={(val) => updateFormField(media.id, 'description', val)} />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <TranslatableField label={t('form.altText') as any} value={formData.altText as any} onChange={(val) => updateFormField(media.id, 'altText', val)} />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <TextInput id="media-tags" labelText={t('form.tags')} value={formData.tags.join(', ')} onChange={(e) => updateFormField(media.id, 'tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))} />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Dropdown
                id="media-folder"
                items={['sliders', 'office-settings', 'users', 'content', 'documents', 'reports', 'videos', 'audio', 'general'].map((f) => ({ id: f, label: f }))}
                itemToString={(i) => (i ? i.label : '')}
                selectedItem={{ id: formData.folder, label: formData.folder }}
                onChange={({ selectedItem }) => updateFormField(media.id, 'folder', selectedItem?.id || 'general')}
                label={t('form.folder')}
                titleText={t('form.folder')}
                invalid={!!validationErrors.folder}
                invalidText={validationErrors.folder}
              />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Toggle id="media-isPublic" labelText={t('form.isPublic')} toggled={formData.isPublic} onToggle={(checked) => updateFormField(media.id, 'isPublic', checked)} />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Toggle id="media-isActive" labelText={t('form.isActive')} toggled={formData.isActive} onToggle={(checked) => updateFormField(media.id, 'isActive', checked)} />
            </div>
          </FormGroup>
        </Column>
      </Grid>
    </div>
  );
};


