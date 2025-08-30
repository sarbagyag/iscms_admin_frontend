"use client";

import React, { useMemo, useState } from 'react';
import { Breadcrumb, BreadcrumbItem, Button, Dropdown, Layer, Search } from '@carbon/react';
import { Add, Reset, Close } from '@carbon/icons-react';
import { CreateSidePanel, unstable_FeatureFlags as FeatureFlags } from '@carbon/ibm-products';
import '@/lib/ibm-products/config';
import { useMediaStore } from '../stores/media-store';
import { useAlbumStore } from '../stores/album-store';
import { MediaList } from './media-list';
import { MediaPanelForms } from './media-panel-forms';
import { AlbumList } from './album-list';
import { AlbumPanelForms } from './album-panel-forms';
import '../styles/media.css';
import { useTranslations } from 'next-intl';

export const MediaContainer: React.FC = () => {
  const mediaStore = useMediaStore();
  const albumStore = useAlbumStore();
  const { selectedTabIndex, setSelectedTabIndex } = mediaStore;
  const t = useTranslations('media');
  const tAlbums = useTranslations('media.albums');

  // Filters for media
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filters for albums
  const [albumStatusFilter, setAlbumStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [albumSearchTerm, setAlbumSearchTerm] = useState('');

  const isMediaTab = selectedTabIndex === 0;

  const panelTitle = useMemo(() => {
    if (isMediaTab) return mediaStore.panelMode === 'edit' ? t('form.editTitle') : t('form.uploadTitle');
    return albumStore.panelMode === 'edit' ? tAlbums('form.editTitle') : tAlbums('form.createTitle');
  }, [isMediaTab, mediaStore.panelMode, albumStore.panelMode, t, tAlbums]);

  const handleResetFilters = () => {
    if (isMediaTab) {
      setStatusFilter('all');
      setVisibilityFilter('all');
      setSearchTerm('');
    } else {
      setAlbumStatusFilter('all');
      setAlbumSearchTerm('');
    }
  };

  const handleCreate = () => {
    if (isMediaTab) mediaStore.openCreatePanel();
    else albumStore.openCreatePanel();
  };

  const panelOpen = isMediaTab ? mediaStore.panelOpen : albumStore.panelOpen;
  const isSubmitting = isMediaTab ? mediaStore.isSubmitting : albumStore.isSubmitting;
  const setSubmitting = isMediaTab ? mediaStore.setSubmitting : albumStore.setSubmitting;
  const closePanel = isMediaTab ? mediaStore.closePanel : albumStore.closePanel;

  const primaryBtnText = isSubmitting
    ? (isMediaTab ? t('form.saving') : tAlbums('form.saving'))
    : (isMediaTab
        ? mediaStore.panelMode === 'edit' ? t('actions.update') : t('actions.create')
        : albumStore.panelMode === 'edit' ? tAlbums('actions.update') : tAlbums('create'));

  const secondaryBtnText = isMediaTab ? t('actions.cancel') : tAlbums('actions.cancel');

  return (
    <Layer className="media-container">
      <div style={{ padding: '2rem 1rem 1rem 1rem' }}>
        <Breadcrumb noTrailingSlash style={{ marginBottom: '1.5rem' }}>
          <BreadcrumbItem href="#">{t('breadcrumbs.home', { default: 'Home' })}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{isMediaTab ? t('title') : tAlbums('title')}</BreadcrumbItem>
        </Breadcrumb>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 400, margin: '0 0 0.5rem 0', textAlign: 'left' }}>{isMediaTab ? t('title') : tAlbums('title')}</h1>
            <p style={{ margin: 0, color: 'var(--cds-text-secondary, #525252)', textAlign: 'left' }}>{isMediaTab ? t('subtitle') : tAlbums('subtitle')}</p>
          </div>

          <Button size="lg" renderIcon={Add} onClick={handleCreate} kind="primary">
            {isMediaTab ? t('form.uploadTitle') : tAlbums('create')}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ padding: '0 1rem 1rem 1rem' }}>
        <div className="media-main-tabs">
          <button type="button" className={`media-tab-button ${isMediaTab ? 'active' : ''}`} onClick={() => setSelectedTabIndex(0)}>
            {t('list.title')}
          </button>
          <button type="button" className={`media-tab-button ${!isMediaTab ? 'active' : ''}`} onClick={() => setSelectedTabIndex(1)}>
            {tAlbums('title')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '0 1rem 1rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {isMediaTab ? (
          <>
            <Search size="lg" labelText={t('filters.search')} placeholder={t('filters.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <Dropdown id="media-status-dropdown" size="md" label={t('filters.status')} titleText={t('filters.status')} items={[{ id: 'all', label: t('filters.all') }, { id: 'active', label: t('filters.active') }, { id: 'inactive', label: t('filters.inactive') }]} selectedItem={{ id: statusFilter, label: statusFilter === 'all' ? t('filters.all') : statusFilter === 'active' ? t('filters.active') : t('filters.inactive') }} itemToString={(item) => (item ? item.label : '')} onChange={({ selectedItem }) => setStatusFilter((selectedItem?.id || 'all') as any)} />
            <Dropdown id="media-visibility-dropdown" size="md" label={t('filters.visibility')} titleText={t('filters.visibility')} items={[{ id: 'all', label: t('filters.all') }, { id: 'public', label: t('filters.public') }, { id: 'private', label: t('filters.private') }]} selectedItem={{ id: visibilityFilter, label: visibilityFilter === 'all' ? t('filters.all') : visibilityFilter === 'public' ? t('filters.public') : t('filters.private') }} itemToString={(item) => (item ? item.label : '')} onChange={({ selectedItem }) => setVisibilityFilter((selectedItem?.id || 'all') as any)} />
          </>
        ) : (
          <>
            <Search size="lg" labelText={t('filters.search', { default: 'Search' } as any)} placeholder={tAlbums('filters.searchPlaceholder')} value={albumSearchTerm} onChange={(e) => setAlbumSearchTerm(e.target.value)} />
            <Dropdown id="album-status-dropdown" size="md" label={tAlbums('filters.status')} titleText={tAlbums('filters.status')} items={[{ id: 'all', label: tAlbums('filters.all') }, { id: 'active', label: tAlbums('filters.active') }, { id: 'inactive', label: tAlbums('filters.inactive') }]} selectedItem={{ id: albumStatusFilter, label: albumStatusFilter === 'all' ? tAlbums('filters.all') : albumStatusFilter === 'active' ? tAlbums('filters.active') : tAlbums('filters.inactive') }} itemToString={(item) => (item ? item.label : '')} onChange={({ selectedItem }) => setAlbumStatusFilter((selectedItem?.id || 'all') as any)} />
          </>
        )}

        <Button kind="ghost" size="md" renderIcon={Reset} onClick={handleResetFilters} disabled={isMediaTab ? (statusFilter === 'all' && visibilityFilter === 'all' && !searchTerm) : (albumStatusFilter === 'all' && !albumSearchTerm)}>
          {t('filters.reset')}
        </Button>
      </div>

      {/* Main Content */}
      <div style={{ padding: '0 1rem 2rem 1rem', textAlign: 'left' }}>
        {isMediaTab ? (
          <MediaList search={searchTerm} statusFilter={statusFilter} visibilityFilter={visibilityFilter} />
        ) : (
          <AlbumList search={albumSearchTerm} statusFilter={albumStatusFilter} />
        )}
      </div>

      {/* Right side panel - depends on active tab */}
      <FeatureFlags enableSidepanelResizer>
        <CreateSidePanel
          title={panelTitle}
          open={panelOpen}
          onRequestClose={() => {
            if (!isSubmitting) closePanel();
          }}
          primaryButtonText={primaryBtnText}
          secondaryButtonText={secondaryBtnText}
          onRequestSubmit={() => {
            if (isSubmitting) return;
            setSubmitting(true);
            const formContainer = document.getElementById(isMediaTab ? 'media-form' : 'album-form');
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
          <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 10 }}>
            <Button
              kind="ghost"
              hasIconOnly
              size="sm"
              iconDescription={t('actions.cancel')}
              onClick={closePanel}
              renderIcon={Close}
            />
          </div>
          <div id={isMediaTab ? 'media-form' : 'album-form'}>
            {isMediaTab ? <MediaPanelForms onSuccess={closePanel} /> : <AlbumPanelForms onSuccess={closePanel} />}
          </div>
        </CreateSidePanel>
      </FeatureFlags>
    </Layer>
  );
};


