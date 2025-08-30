"use client";

import React, { useEffect, useState } from 'react';
import { InlineLoading, Pagination, OverflowMenu, OverflowMenuItem, Tag, Table, TableHead, TableRow, TableHeader, TableBody, TableCell, TableContainer } from '@carbon/react';
import { DataBase } from '@carbon/icons-react';
import { useAlbums } from '../hooks/use-album-queries';
import type { Album, AlbumQuery } from '../types/album';
import { useAlbumStore } from '../stores/album-store';
import { useTranslations } from 'next-intl';

interface AlbumListProps {
  search?: string;
  statusFilter?: 'all' | 'active' | 'inactive';
}

export const AlbumList: React.FC<AlbumListProps> = ({ search = '', statusFilter = 'all' }) => {
  const [query, setQuery] = useState<Partial<AlbumQuery>>({ page: 1, limit: 12 });
  const { openEditPanel } = useAlbumStore();
  const queryResult = useAlbums(query);
  const t = useTranslations('media.albums');
  const tMedia = useTranslations('media');

  useEffect(() => {
    setQuery((prev) => ({ ...prev, page: 1, search: search || undefined, isActive: statusFilter === 'all' ? undefined : statusFilter === 'active' }));
  }, [search, statusFilter]);

  const data = queryResult.data;
  const items = (data?.data ?? []) as Album[];
  const pagination = data?.pagination;

  if (queryResult.isLoading && items.length === 0) {
    return (
      <div className="loading-container">
        <InlineLoading description={t('list.loading')} />
      </div>
    );
  }

  return (
    <div>
      {items.length > 0 ? (
        <TableContainer title={t('title')} description={t('subtitle')}>
          <Table size="md" useZebraStyles>
            <TableHead>
              <TableRow>
                <TableHeader>{t('form.nameEn')}</TableHeader>
                <TableHeader>{t('form.descriptionEn')}</TableHeader>
                <TableHeader>{t('list.items', { default: 'Items' } as any)}</TableHeader>
                <TableHeader>{t('filters.status')}</TableHeader>
                <TableHeader>{tMedia('card.actions')}</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-en" title={a.name.en}>{a.name.en || a.name.ne}</TableCell>
                  <TableCell className="font-en" title={a.description?.en || a.description?.ne || ''}>
                    {(a.description?.en || a.description?.ne || '').slice(0, 80)}
                  </TableCell>
                  <TableCell>{a.mediaCount}</TableCell>
                  <TableCell>
                    <Tag size="sm" type={a.isActive ? 'green' : 'gray'}>{a.isActive ? 'Active' : 'Inactive'}</Tag>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <OverflowMenu flipped size="sm" aria-label={tMedia('card.actions')}>
                      <OverflowMenuItem itemText={tMedia('card.edit')} onClick={() => openEditPanel(a)} />
                      <OverflowMenuItem hasDivider isDelete itemText={tMedia('card.delete')} onClick={() => { /* delete later */ }} />
                    </OverflowMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <div className="empty-state">
          <div className="empty-state-content">
            <div className="empty-state-icon">
              <DataBase size={48} />
            </div>
            <h3 className="empty-state-title">{t('list.emptyTitle')}</h3>
            <p className="empty-state-description">{t('list.emptyDescription')}</p>
          </div>
        </div>
      )}

      {!!pagination && items.length > 0 && (
        <div className="pagination-container">
          <Pagination
            page={pagination.page}
            pageSize={pagination.limit}
            pageSizes={[12, 24, 48, 96]}
            totalItems={pagination.total}
            onChange={({ page, pageSize }) => {
              if (page !== undefined) setQuery((prev) => ({ ...prev, page }));
              if (pageSize !== undefined) setQuery((prev) => ({ ...prev, limit: pageSize, page: 1 }));
            }}
            size="md"
          />
        </div>
      )}
    </div>
  );
};


