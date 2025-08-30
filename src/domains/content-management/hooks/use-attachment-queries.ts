import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AttachmentService } from '../services/attachment-service';
import { 
  ContentAttachment, 
  CreateAttachmentDto, 
  UpdateAttachmentDto, 
  ReorderItemDto,
  AttachmentQuery, 
  AttachmentListResponse,
  AttachmentStatistics 
} from '../types/attachment';

export const attachmentKeys = {
  all: ['attachments'] as const,
  list: (query: Partial<AttachmentQuery> = {}) => [...attachmentKeys.all, 'list', query] as const,
  byContent: (contentId: string) => [...attachmentKeys.all, 'byContent', contentId] as const,
  detail: (id: string) => [...attachmentKeys.all, 'detail', id] as const,
  stats: () => [...attachmentKeys.all, 'stats'] as const,
  presignedUrl: (id: string, expiresIn?: number, operation?: string) => [...attachmentKeys.all, 'presignedUrl', id, expiresIn, operation] as const,
  withPresignedUrls: (contentId: string, expiresIn?: number) => [...attachmentKeys.all, 'withPresignedUrls', contentId, expiresIn] as const,
};

// ========================================
// QUERIES
// ========================================

export const useAttachments = (query: Partial<AttachmentQuery> = {}) => {
  return useQuery<AttachmentListResponse>({
    queryKey: attachmentKeys.list(query),
    queryFn: () => AttachmentService.getAttachments(query),
    placeholderData: (previousData) => previousData,
  });
};

export const useAttachmentsByContent = (contentId: string, enabled = true) => {
  return useQuery<ContentAttachment[]>({
    queryKey: attachmentKeys.byContent(contentId),
    queryFn: () => AttachmentService.getAttachmentsByContent(contentId),
    enabled: !!contentId && enabled,
  });
};

export const useAttachment = (id: string, enabled = true) => {
  return useQuery<ContentAttachment>({
    queryKey: attachmentKeys.detail(id),
    queryFn: () => AttachmentService.getAttachmentById(id),
    enabled: !!id && enabled,
  });
};

export const useAttachmentStatistics = () => {
  return useQuery<AttachmentStatistics>({
    queryKey: attachmentKeys.stats(),
    queryFn: () => AttachmentService.getAttachmentStatistics(),
  });
};

export const useAttachmentPresignedUrl = (id: string, expiresIn?: number, operation?: 'get' | 'put', enabled = true) => {
  return useQuery<string | null>({
    queryKey: attachmentKeys.presignedUrl(id, expiresIn, operation),
    queryFn: async () => {
      try {
        return await AttachmentService.getPresignedUrl(id, expiresIn, operation);
      } catch (error) {
        console.warn('Failed to get presigned URL:', error);
        return null; // Return null instead of throwing
      }
    },
    enabled: !!id && enabled,
    staleTime: (expiresIn || 86400) * 1000 - 60000, // Expire 1 minute before URL expires
    retry: 1, // Only retry once
    retryDelay: 1000,
  });
};

export const useAttachmentsWithPresignedUrls = (contentId: string, expiresIn?: number, enabled = true) => {
  return useQuery<ContentAttachment[]>({
    queryKey: attachmentKeys.withPresignedUrls(contentId, expiresIn),
    queryFn: async () => {
      try {
        return await AttachmentService.getAttachmentsWithPresignedUrls(contentId, expiresIn);
      } catch (error) {
        console.warn('Failed to get attachments with presigned URLs:', error);
        // Fallback to regular attachments without presigned URLs
        return AttachmentService.getAttachmentsByContent(contentId);
      }
    },
    enabled: !!contentId && enabled,
    staleTime: (expiresIn || 86400) * 1000 - 60000, // Expire 1 minute before URL expires
    retry: 1, // Only retry once
    retryDelay: 1000,
  });
};

// ========================================
// MUTATIONS
// ========================================

export const useCreateAttachment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, file }: { data: CreateAttachmentDto; file: File }) => 
      AttachmentService.createAttachment(data, file),
    onSuccess: (attachment) => {
      // Invalidate queries for the specific content
      qc.invalidateQueries({ queryKey: attachmentKeys.byContent(attachment.contentId) });
      qc.invalidateQueries({ queryKey: attachmentKeys.list({}) });
      qc.invalidateQueries({ queryKey: attachmentKeys.stats() });
    },
    onError: (error) => {
      console.error('Attachment creation error:', error);
    },
  });
};

export const useUpdateAttachment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAttachmentDto }) => 
      AttachmentService.updateAttachment(id, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: attachmentKeys.detail(updated.id) });
      qc.invalidateQueries({ queryKey: attachmentKeys.byContent(updated.contentId) });
      qc.invalidateQueries({ queryKey: attachmentKeys.list({}) });
    },
    onError: (error) => {
      console.error('Attachment update error:', error);
    },
  });
};

export const useDeleteAttachment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AttachmentService.deleteAttachment(id),
    onSuccess: (_, deletedId) => {
      // Get the attachment details to invalidate the correct content queries
      const attachment = qc.getQueryData<ContentAttachment>(attachmentKeys.detail(deletedId));
      if (attachment) {
        qc.invalidateQueries({ queryKey: attachmentKeys.byContent(attachment.contentId) });
      }
      qc.invalidateQueries({ queryKey: attachmentKeys.list({}) });
      qc.invalidateQueries({ queryKey: attachmentKeys.stats() });
    },
    onError: (error) => {
      console.error('Attachment deletion error:', error);
    },
  });
};

export const useReorderAttachments = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contentId, orders }: { contentId: string; orders: ReorderItemDto[] }) => 
      AttachmentService.reorderAttachments(contentId, orders),
    onSuccess: (_, { contentId }) => {
      qc.invalidateQueries({ queryKey: attachmentKeys.byContent(contentId) });
      qc.invalidateQueries({ queryKey: attachmentKeys.list({}) });
    },
    onError: (error) => {
      console.error('Attachment reorder error:', error);
    },
  });
};

export const useBulkDeleteAttachments = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => AttachmentService.bulkDeleteAttachments(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attachmentKeys.all });
    },
    onError: (error) => {
      console.error('Bulk attachment deletion error:', error);
    },
  });
};

export const useDownloadAttachment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AttachmentService.downloadAttachment(id),
    onSuccess: (blob, id) => {
      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Try to get filename from content disposition or use ID
      const attachment = qc.getQueryData<ContentAttachment>(attachmentKeys.detail(id));
      const filename = attachment?.fileName || `attachment-${id}`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      console.error('Attachment download error:', error);
    },
  });
};

// ========================================
// UTILITY HOOKS
// ========================================

export const useAttachmentQueries = () => {
  return {
    // Queries
    useAttachments,
    useAttachmentsByContent,
    useAttachment,
    useAttachmentStatistics,
    
    // Mutations
    useCreateAttachment,
    useUpdateAttachment,
    useDeleteAttachment,
    useReorderAttachments,
    useBulkDeleteAttachments,
    useDownloadAttachment,
  };
};
