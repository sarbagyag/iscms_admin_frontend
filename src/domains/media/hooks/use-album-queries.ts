import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { albumRepository } from '../repositories/album-repository';
import type { Album, AlbumListResponse, AlbumQuery } from '../types/album';
import { MediaNotificationService } from '../services/media-notification-service';

const keys = {
  list: (q: Partial<AlbumQuery>) => ['albums', 'list', q] as const,
  item: (id: string) => ['albums', 'item', id] as const,
};

export const useAlbums = (query: Partial<AlbumQuery> = {}) =>
  useQuery<AlbumListResponse>({
    queryKey: keys.list(query),
    queryFn: () => albumRepository.list(query),
  });

export const useAlbum = (id: string, enabled = true) =>
  useQuery<Album>({
    queryKey: keys.item(id),
    queryFn: () => albumRepository.getById(id),
    enabled: !!id && enabled,
  });

export const useCreateAlbum = () =>
  useMutation({
    mutationFn: (data: Partial<Album>) => albumRepository.create(data),
    onSuccess: (album) => {
      MediaNotificationService.created(album.name?.en || 'Album');
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });

export const useUpdateAlbum = () =>
  useMutation({
    mutationFn: (params: { id: string; data: Partial<Album> }) => albumRepository.update(params.id, params.data),
    onSuccess: (album) => {
      MediaNotificationService.updated(album.name?.en || 'Album');
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });

export const useDeleteAlbum = () =>
  useMutation({
    mutationFn: (id: string) => albumRepository.delete(id),
    onSuccess: () => {
      MediaNotificationService.deleted('Album');
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });

export const useAddMediaToAlbum = () =>
  useMutation({
    mutationFn: (params: { albumId: string; mediaId: string }) => albumRepository.addMedia(params.albumId, params.mediaId),
    onSuccess: () => {
      MediaNotificationService.showSuccess('Added to album');
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });

export const useRemoveMediaFromAlbum = () =>
  useMutation({
    mutationFn: (params: { albumId: string; mediaId: string }) => albumRepository.removeMedia(params.albumId, params.mediaId),
    onSuccess: () => {
      MediaNotificationService.showSuccess('Removed from album');
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });

export const useReorderAlbum = () =>
  useMutation({
    mutationFn: (params: { albumId: string; items: Array<{ mediaId: string; position: number }> }) => albumRepository.reorder(params.albumId, params.items),
    onSuccess: () => {
      MediaNotificationService.showSuccess('Album order updated');
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });


