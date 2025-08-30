"use client";

import React, { useState, useCallback } from "react";
import {
  Button,
  FileUploader,
  FileUploaderItem,
  InlineLoading,
  InlineNotification,
  Tag,
  Grid,
  Column,
  Modal,
  TextInput,
  NumberInput,
  FormGroup,
} from "@carbon/react";
import {
  TrashCan,
  Download,
  View,
  Edit,
  ArrowsVertical,
} from "@carbon/icons-react";
import { useTranslations } from "next-intl";
import { ContentAttachment, AttachmentUploadProgress } from "../types/attachment";
import { useContentStore } from "../stores/content-store";
import { AttachmentService } from "../services/attachment-service";
import { httpClient } from "@/lib/api/http-client";
import "../styles/content-management.css";

interface ContentAttachmentManagerProps {
  contentId?: string;
  attachments: ContentAttachment[];
  onAttachmentsChange: (attachments: ContentAttachment[]) => void;
  isReadOnly?: boolean;
}

// Backend API response structure
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string | string[];
  };
}

// Parse backend response
const parseApiResponse = (response: any) => {
  if (response?.success && response?.data !== undefined) {
    return response.data;
  }
  throw new Error(response?.error?.message || 'API response parsing failed');
};

export const ContentAttachmentManager: React.FC<ContentAttachmentManagerProps> = ({
  contentId,
  attachments,
  onAttachmentsChange,
  isReadOnly = false,
}) => {
  const t = useTranslations("content-management");
  const [uploadProgress, setUploadProgress] = useState<AttachmentUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderData, setReorderData] = useState<{ id: string; order: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Upload attachment to backend with validation
  const uploadAttachment = async (contentId: string, file: File, order: number): Promise<ContentAttachment> => {
    // Validate file before upload
    const validation = AttachmentService.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid file');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('contentId', contentId);
    formData.append('order', order.toString());

    const response = await httpClient.post<ApiResponse<ContentAttachment>>('/attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return parseApiResponse(response) as ContentAttachment;
  };
  
  // Delete attachment from backend
  const deleteAttachment = async (attachmentId: string): Promise<void> => {
    await httpClient.delete(`/attachments/${attachmentId}`);
  };
  
  // Reorder attachments on backend
  const reorderAttachments = async (contentId: string, reorderData: { id: string; order: number }[]): Promise<void> => {
    await httpClient.put(`/attachments/reorder`, { contentId, orders: reorderData });
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!contentId) {
      setError("Content must be saved before uploading attachments");
      return;
    }

    setIsUploading(true);
    setError(null);

    const newProgress: AttachmentUploadProgress[] = Array.from(files).map((file, index) => ({
      fileId: `temp-${Date.now()}-${index}`,
      fileName: file.name,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadProgress(newProgress);

    try {
      const uploadedAttachments: ContentAttachment[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        
        const progressIndex = newProgress.findIndex(p => p.fileName === file.name);
        
        try {
          // Simulate progress updates
          for (let progress = 0; progress <= 100; progress += 10) {
            setUploadProgress(prev => 
              prev.map(p => 
                p.fileName === file.name 
                  ? { ...p, progress } 
                  : p
              )
            );
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          const attachment = await uploadAttachment(contentId, file, attachments.length + i);
          uploadedAttachments.push(attachment);

          // Update progress to success
          setUploadProgress(prev => 
            prev.map(p => 
              p.fileName === file.name 
                ? { ...p, status: 'success' as const, progress: 100 } 
                : p
            )
          );
        } catch (err) {
          setUploadProgress(prev => 
            prev.map(p => 
              p.fileName === file.name 
                ? { ...p, status: 'error' as const, error: err instanceof Error ? err.message : 'Upload failed' } 
                : p
            )
          );
        }
      }

      // Add new attachments to the list
      const updatedAttachments = [...attachments, ...uploadedAttachments];
      onAttachmentsChange(updatedAttachments);

      // Clear progress after a delay
      setTimeout(() => setUploadProgress([]), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [contentId, attachments, uploadAttachment, onAttachmentsChange]);

  const handleDeleteAttachment = useCallback(async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId);
      const updatedAttachments = attachments.filter(a => a.id !== attachmentId);
      onAttachmentsChange(updatedAttachments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete attachment');
    }
  }, [attachments, deleteAttachment, onAttachmentsChange]);

  const handleReorder = useCallback(async () => {
    if (!contentId) return;

    try {
      await reorderAttachments(contentId, reorderData);
      const updatedAttachments = [...attachments].sort((a, b) => {
        const aOrder = reorderData.find(r => r.id === a.id)?.order ?? a.order;
        const bOrder = reorderData.find(r => r.id === b.id)?.order ?? b.order;
        return aOrder - bOrder;
      });
      onAttachmentsChange(updatedAttachments);
      setShowReorderModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder attachments');
    }
  }, [contentId, reorderData, reorderAttachments, attachments, onAttachmentsChange]);

  const openReorderModal = useCallback(() => {
    const initialData = attachments.map(a => ({ id: a.id, order: a.order }));
    setReorderData(initialData);
    setShowReorderModal(true);
  }, [attachments]);

  const formatFileSize = (bytes: number): string => {
    return AttachmentService.formatFileSize(bytes);
  };

  const getFileIcon = (mimeType: string): string => {
    return AttachmentService.getFileIcon(mimeType);
  };

  const getFileTypeLabel = (mimeType: string): string => {
    return AttachmentService.getFileTypeLabel(mimeType);
  };

  return (
    <div className="attachment-manager">
      {/* Header */}
      <div className="attachment-manager-header">
        <h3>{t("attachments.title")}</h3>
        <p>{t("attachments.subtitle")}</p>
      </div>

      {/* Error Display */}
      {error && (
        <InlineNotification
          kind="error"
          title={t("attachments.uploadError")}
          subtitle={error}
          onClose={() => setError(null)}
          style={{ marginBottom: '1rem' }}
        />
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="upload-progress" style={{ marginBottom: '1rem' }}>
          {uploadProgress.map((progress) => (
            <div key={progress.fileId} className="upload-progress-item">
              <InlineLoading
                description={`${progress.fileName} - ${progress.progress}%`}
                status={progress.status === 'success' ? 'finished' : progress.status === 'error' ? 'error' : 'active'}
                style={{ width: '100%' }}
              />
              {progress.status === 'error' && progress.error && (
                <InlineNotification
                  kind="error"
                  subtitle={progress.error}
                  style={{ marginTop: '0.5rem' }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* File Uploader */}
      {!isReadOnly && contentId && (
        <div className="file-uploader-section" style={{ marginBottom: '2rem' }}>
          <FileUploader
            accept={['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.jpg', '.jpeg', '.png', '.gif']}
            buttonKind="primary"
            buttonLabel={t("attachments.uploadButton")}
            filenameStatus="edit"
            iconDescription={t("attachments.dragDropText")}
            labelDescription={t("attachments.supportedFormats")}
            labelTitle={t("attachments.title")}
            multiple={true}
            onChange={handleFileUpload}
            disabled={isUploading}
            size="lg"
          />
        </div>
      )}

      {/* Attachments List */}
      <div className="attachments-list">
        {attachments.length === 0 ? (
          <div className="no-attachments">
            <p>{t("attachments.noAttachments")}</p>
            {!contentId && (
              <p className="create-first-hint">{t("attachments.createFirst")}</p>
            )}
          </div>
        ) : (
          <>
            {/* Actions Bar */}
            <div className="attachments-actions" style={{ marginBottom: '1rem' }}>
                              <Button
                  kind="ghost"
                  size="sm"
                  renderIcon={ArrowsVertical}
                  onClick={openReorderModal}
                  disabled={isReadOnly}
                >
                  {t("attachments.reorder")}
                </Button>
            </div>

            {/* Attachments Grid */}
            <Grid condensed>
              {attachments.map((attachment) => (
                <Column key={attachment.id} lg={4} md={6} sm={4}>
                  <div className="attachment-card">
                    <div className="attachment-icon">
                      {getFileIcon(attachment.mimeType)}
                    </div>
                    <div className="attachment-info">
                      <h4 className="attachment-filename" title={attachment.fileName}>
                        {attachment.fileName}
                      </h4>
                      <p className="attachment-meta">
                        {formatFileSize(attachment.fileSize)} • {attachment.mimeType}
                      </p>
                      <p className="attachment-date">
                        {new Date(attachment.createdAt).toLocaleDateString()}
                      </p>
                      <Tag size="sm" type="blue">
                        Order: {attachment.order}
                      </Tag>
                    </div>
                    <div className="attachment-actions">
                      <Button
                        kind="ghost"
                        size="sm"
                        hasIconOnly
                        iconDescription={t("attachments.downloadFile")}
                        renderIcon={Download}
                        onClick={() => window.open(attachment.downloadUrl, '_blank')}
                      />
                      {!isReadOnly && (
                        <Button
                          kind="ghost"
                          size="sm"
                          hasIconOnly
                          iconDescription={t("attachments.removeFile")}
                          renderIcon={TrashCan}
                          onClick={() => handleDeleteAttachment(attachment.id)}
                        />
                      )}
                    </div>
                  </div>
                </Column>
              ))}
            </Grid>
          </>
        )}
      </div>

      {/* Reorder Modal */}
      <Modal
        open={showReorderModal}
        modalHeading={t("attachments.reorderTitle")}
        primaryButtonText={t("attachments.saveOrder")}
        secondaryButtonText={t("attachments.cancel")}
        onRequestSubmit={handleReorder}
        onRequestClose={() => setShowReorderModal(false)}
        size="md"
      >
        <p>{t("attachments.reorderDescription")}</p>
        <div className="reorder-form">
          {reorderData.map((item) => (
            <FormGroup key={item.id} legendText="" style={{ marginBottom: '1rem' }}>
              <label>
                {attachments.find(a => a.id === item.id)?.fileName}
              </label>
              <NumberInput
                id={`order-${item.id}`}
                label=""
                min={0}
                value={item.order}
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  const newValue = parseInt(target.value) || 0;
                  setReorderData(prev => 
                    prev.map(r => 
                      r.id === item.id ? { ...r, order: newValue } : r
                    )
                  );
                }}
              />
            </FormGroup>
          ))}
        </div>
      </Modal>
    </div>
  );
}; 