import { httpClient } from '@/lib/api/http-client';
import type { Album, AlbumListResponse, AlbumMediaItem, AlbumQuery } from '../types/album';

export interface AlbumRepository {
  list(params?: Partial<AlbumQuery>): Promise<AlbumListResponse>;
  getById(id: string): Promise<Album>;
  create(data: Partial<Album>): Promise<Album>;
  update(id: string, data: Partial<Album>): Promise<Album>;
  delete(id: string): Promise<void>;
  addMedia(albumId: string, mediaId: string): Promise<{ message: string }>; 
  removeMedia(albumId: string, mediaId: string): Promise<{ message: string }>; 
  reorder(albumId: string, items: Array<{ mediaId: string; position: number }>): Promise<{ message: string }>; 
}

class AlbumRepositoryImpl implements AlbumRepository {
  // Align with backend controller @Controller('media') and albums routes under /media/albums
  private readonly BASE_URL = '/media/albums';
  private normalizeErrorMessage(msg?: string | string[]): string {
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || '';
  }

  async list(params: Partial<AlbumQuery> = {}): Promise<AlbumListResponse> {
    const res = await httpClient.get<AlbumListResponse>(`${this.BASE_URL}`, { params });
    if (!res.success) {
      // Gracefully handle missing albums API by returning an empty list
      const code = res.error?.code || '';
      const msg = this.normalizeErrorMessage(res.error?.message);
      if (code === 'NOT_FOUND_ERROR' || /cannot\s+get\s+.*\/albums/i.test(msg)) {
        return {
          data: [],
          pagination: {
            page: params.page ?? 1,
            limit: params.limit ?? 12,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }
      throw new Error(this.normalizeErrorMessage(res.error?.message) || 'Failed to load albums');
    }

    // Backend may return either:
    // 1) data: Album[] and pagination at root
    // 2) data: AlbumListResponse { data: Album[]; pagination: { ... } }
    const root: any = res;
    const payload = root?.data;

    if (Array.isArray(payload)) {
      return {
        data: payload as Album[],
        pagination: root?.pagination ?? {
          page: params.page ?? 1,
          limit: params.limit ?? (payload as Album[]).length,
          total: root?.meta?.total ?? (payload as Album[]).length,
          totalPages: root?.meta?.totalPages ?? 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    if (payload?.data && payload?.pagination) {
      return payload as AlbumListResponse;
    }

    throw new Error('Unexpected albums list response shape');
  }

  async getById(id: string): Promise<Album> {
    const res = await httpClient.get<Album | AlbumListResponse>(`${this.BASE_URL}/${id}`);
    if (!res.success) throw new Error(this.normalizeErrorMessage(res.error?.message) || 'Album not found');
    const payload: any = res.data;
    if (!payload) throw new Error('Album not found');
    // If backend returns the album directly
    if (payload && payload.id) return payload as Album;
    // If backend returns a list envelope
    if (Array.isArray(payload)) {
      const first = (payload as Album[])[0];
      if (!first) throw new Error('Album not found');
      return first;
    }
    if (payload?.data && Array.isArray(payload.data)) {
      const first = (payload.data as Album[])[0];
      if (!first) throw new Error('Album not found');
      return first;
    }
    throw new Error('Unexpected album response shape');
  }

  async create(data: Partial<Album>): Promise<Album> {
    const res = await httpClient.post<Album>(`${this.BASE_URL}`, data);
    if (!res.success || !res.data) throw new Error(this.normalizeErrorMessage(res.error?.message) || 'Failed to create album');
    return res.data;
  }

  async update(id: string, data: Partial<Album>): Promise<Album> {
    const res = await httpClient.put<Album>(`${this.BASE_URL}/${id}`, data);
    if (!res.success || !res.data) throw new Error(this.normalizeErrorMessage(res.error?.message) || 'Failed to update album');
    return res.data;
  }

  async delete(id: string): Promise<void> {
    const res = await httpClient.delete(`${this.BASE_URL}/${id}`);
    if (!res.success) throw new Error(this.normalizeErrorMessage(res.error?.message) || 'Failed to delete album');
  }

  async addMedia(albumId: string, mediaId: string): Promise<{ message: string }> {
    // Backend expects POST /media/albums/:id/media with body { mediaIds: string[] }
    const res = await httpClient.post<{ message: string }>(`${this.BASE_URL}/${albumId}/media`, { mediaIds: [mediaId] });
    if (!res.success || !res.data) throw new Error(this.normalizeErrorMessage(res.error?.message) || 'Failed to add media to album');
    return res.data;
  }

  async removeMedia(albumId: string, mediaId: string): Promise<{ message: string }> {
    const res = await httpClient.delete<{ message: string }>(`${this.BASE_URL}/${albumId}/media/${mediaId}`);
    if (!res.success || !res.data) throw new Error(this.normalizeErrorMessage(res.error?.message) || 'Failed to remove media from album');
    return res.data;
  }

  async reorder(albumId: string, items: Array<{ mediaId: string; position: number }>): Promise<{ message: string }> {
    // No explicit reorder endpoint defined in backend controller.
    // Keep API surface but return a graceful message to avoid breaking callers.
    return Promise.resolve({ message: 'Reorder not supported by backend' });
  }
}

export const albumRepository: AlbumRepository = new AlbumRepositoryImpl();


