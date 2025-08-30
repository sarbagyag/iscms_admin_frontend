"use client";

import React, { useMemo, useState } from 'react';
import { Breadcrumb, BreadcrumbItem, Button, Dropdown, Layer, Search } from '@carbon/react';
import { Add, Reset } from '@carbon/icons-react';
import { CreateSidePanel, unstable_FeatureFlags as FeatureFlags } from '@carbon/ibm-products';
import '@/lib/ibm-products/config';
import { useAlbumStore } from '../stores/album-store';
import { AlbumList } from '@/domains/media/components/album-list';
import { AlbumPanelForms } from '@/domains/media/components/album-panel-forms';
import { useTranslations } from 'next-intl';

export const AlbumContainer: React.FC = () => {
  const { panelOpen, panelMode, openCreatePanel, closePanel, isSubmitting, setSubmitting } = useAlbumStore();
  const t = useTranslations('media.albums');
  const tmedia = useTranslations('media');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const panelTitle = useMemo(() => (panelMode === 'edit' ? t('form.editTitle') : t('form.createTitle')), [panelMode, t]);

  const handleResetFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
  };

  return (
    <Layer className="media-container">
      <div style={{ padding: '2rem 1rem 1rem 1rem' }}>
        <Breadcrumb noTrailingSlash style={{ marginBottom: '1.5rem' }}>
          <BreadcrumbItem href="#">{t('breadcrumbs.home', { default: 'Home' })}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('title')}</BreadcrumbItem>
        </Breadcrumb>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 400, margin: '0 0 0.5rem 0', textAlign: 'left' }}>{t('title')}</h1>
            <p style={{ margin: 0, color: 'var(--cds-text-secondary, #525252)', textAlign: 'left' }}>{t('subtitle')}</p>
          </div>

          <Button size="lg" renderIcon={Add} onClick={openCreatePanel} kind="primary">
            {t('create')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '0 1rem 1rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Search size="lg" labelText={tmedia('filters.search', { default: 'Search' } as any)} placeholder={t('filters.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <Dropdown
          id="album-status-dropdown"
          size="md"
          label={t('filters.status')}
          titleText={t('filters.status')}
          items={[{ id: 'all', label: t('filters.all') }, { id: 'active', label: t('filters.active') }, { id: 'inactive', label: t('filters.inactive') }]}
          selectedItem={{ id: statusFilter, label: statusFilter === 'all' ? t('filters.all') : statusFilter === 'active' ? t('filters.active') : t('filters.inactive') }}
          itemToString={(item) => (item ? item.label : '')}
          onChange={({ selectedItem }) => setStatusFilter((selectedItem?.id || 'all') as any)}
        />
        <Button kind="ghost" size="md" renderIcon={Reset} onClick={handleResetFilters} disabled={statusFilter === 'all' && !searchTerm}>
          {t('filters.reset')}
        </Button>
      </div>

      {/* Main Content */}
      <div style={{ padding: '0 1rem 2rem 1rem', textAlign: 'left' }}>
        <AlbumList search={searchTerm} statusFilter={statusFilter} />
      </div>

      {/* Right side panel */}
      <FeatureFlags enableSidepanelResizer>
        <CreateSidePanel
          title={panelTitle}
          open={panelOpen}
          onRequestClose={() => {
            if (!isSubmitting) closePanel();
          }}
          primaryButtonText={isSubmitting ? t('form.saving') : panelMode === 'edit' ? t('actions.update') : t('create')}
          secondaryButtonText={t('actions.cancel')}
          onRequestSubmit={() => {
            if (isSubmitting) return;
            setSubmitting(true);
            const formContainer = document.getElementById('album-form');
            if (formContainer) {
              const form = formContainer.closest('form') as HTMLFormElement;
              if (form) {
                const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
                form.dispatchEvent(submitEvent);
              }
            } else {
              setSubmitting(false);
            }
          }}
          selectorPageContent="#main-content"
          formTitle="Basic Info"
          selectorPrimaryFocus="input, textarea, [tabindex]:not([tabindex='-1'])"
        >
          <div id="album-form">
            <AlbumPanelForms onSuccess={closePanel} />
          </div>
        </CreateSidePanel>
      </FeatureFlags>
    </Layer>
  );
};


