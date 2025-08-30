"use client";

import React, { useCallback, useState } from "react";
import { Button, Tile, Stack, InlineLoading, TextInput, TextArea, FormGroup } from "@carbon/react";
import { Upload, TrashCan, Document, Close } from "@carbon/icons-react";
import { useTranslations } from "next-intl";
import { AttachmentService } from "../../services/attachment-service";
import { AttachmentNotificationService } from "../../services/attachment-notification-service";
import { useAttachmentStore } from "../../stores/attachment-store";
import { useCreateAttachment } from "../../hooks/use-attachment-queries";

interface AttachmentUploadProps {
  className?: string;
}

export const AttachmentUpload: React.FC<AttachmentUploadProps> = ({
  className = "",
}) => {
  const t = useTranslations("content-management");
  const { 
    selectedContentId, 
    closePanel, 
    isUploading, 
    setUploading,
    formData,
    updateFormField,
    setSelectedFiles: setStoreSelectedFiles,
    resetForm
  } = useAttachmentStore();
  const createAttachmentMutation = useCreateAttachment();
  
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        validateAndSetFiles(files);
      }
    },
    []
  );

  const validateAndSetFiles = (files: File[]) => {
    const errors: Record<string, string> = {};
    const validFiles: File[] = [];

    files.forEach((file, index) => {
      const validation = AttachmentService.validateFile(file);
      if (!validation.isValid) {
        errors[`file-${index}`] = validation.error || "Invalid file";
      } else {
        validFiles.push(file);
      }
    });

    setValidationErrors(errors);
    setSelectedFiles(validFiles);
    setStoreSelectedFiles(validFiles);
  };

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);

      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) {
        validateAndSetFiles(files);
      }
    },
    []
  );

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    // Clear validation error for this file
    const newErrors = { ...validationErrors };
    delete newErrors[`file-${index}`];
    setValidationErrors(newErrors);
    // Update store
    setStoreSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  }, [validationErrors, selectedFiles, setStoreSelectedFiles]);

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0 || !selectedContentId) return;
    
    setUploading(true);
    
    try {
      // Upload each file
      for (const file of selectedFiles) {
        await createAttachmentMutation.mutateAsync({
          data: {
            contentId: selectedContentId,
            fileName: file.name,
            filePath: '', // This will be set by the backend
            fileSize: file.size,
            mimeType: file.type,
            altText: formData.altText,
            description: formData.description,
            order: formData.order,
          },
          file,
        });
      }
      
      if (selectedFiles.length === 1 && selectedFiles[0]) {
        AttachmentNotificationService.showAttachmentUploaded(selectedFiles[0].name);
      } else if (selectedFiles.length > 1) {
        AttachmentNotificationService.showMultipleAttachmentsUploaded(selectedFiles.length);
      }
      resetForm();
      setSelectedFiles([]);
      setValidationErrors({});
      closePanel();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      if (selectedFiles.length === 1 && selectedFiles[0]) {
        AttachmentNotificationService.showAttachmentUploadError(errorMessage, selectedFiles[0].name);
      } else {
        AttachmentNotificationService.showAttachmentUploadError(errorMessage);
      }
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  }, [selectedFiles, selectedContentId, formData, createAttachmentMutation, setUploading, resetForm, closePanel]);

  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const canUpload = selectedFiles.length > 0 && !hasValidationErrors && !isUploading;

  return (
    <div className={`attachment-upload media-multi-upload ${className}`}>
      {/* Header */}
      <div className="upload-header">
        <h3>{t('attachments.upload.title', { default: 'Upload Files' })}</h3>
        <Button
          kind="ghost"
          size="sm"
          renderIcon={Close}
          onClick={closePanel}
          hasIconOnly
          iconDescription="Close"
        />
      </div>

      {/* File Upload Area */}
      <FormGroup legendText={t('attachments.upload.files', { default: 'File(s)' })}>
        <Tile
          className={`upload-area ${dragOver ? "drag-over" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Stack gap={4} className="upload-content">
            {isUploading ? (
              <div className="upload-loading">
                <InlineLoading description={t("attachments.upload.uploading", { default: "Uploading files..." })} />
              </div>
            ) : (
              <>
                <Document size={32} className="upload-icon" />
                <p style={{ margin: 0, fontSize: '0.875rem' }}>{t("attachments.upload.placeholder", { default: "File(s)" })}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--cds-text-02)' }}>{t("attachments.upload.supported", { default: "Please select at least one file" })}</p>
                <input
                  type="file"
                  multiple
                  accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.txt,.csv,.xml,.json,.zip,.rar,.7z,.tar,.gz"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  id="attachment-file-input"
                />
                <Button
                  kind="secondary"
                  disabled={isUploading}
                  type="button"
                  size="sm"
                  onClick={() => document.getElementById("attachment-file-input")?.click()}
                >
                  {t("attachments.upload.browse", { default: "Choose files" })}
                </Button>
              </>
            )}
          </Stack>
        </Tile>
      </FormGroup>

      {/* Validation Errors */}
      {hasValidationErrors && (
        <div className="validation-errors">
          {Object.entries(validationErrors).map(([key, error]) => (
            <div key={key} className="validation-error">
              <p className="error-message">{error}</p>
            </div>
          ))}
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div className="media-upload-grid">
            {selectedFiles.map((file, index) => (
              <div key={index} className="media-upload-card">
                <div className="media-upload-card__preview" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--cds-ui-02)' }}>
                  <Document size={32} />
                </div>
                <div className="media-upload-card__content">
                  <div className="media-upload-card__title" title={file.name}>{file.name}</div>
                  <div className="media-upload-card__meta">{AttachmentService.formatFileSize(file.size)}</div>
                </div>
                <div className="media-upload-card__actions">
                  <Button
                    kind="danger--ghost"
                    size="sm"
                    renderIcon={TrashCan}
                    onClick={() => handleRemoveFile(index)}
                    disabled={isUploading}
                  >
                    {t("attachments.upload.remove", { default: "Remove" })}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata Fields */}
      {selectedFiles.length > 0 && (
        <FormGroup legendText={t("attachments.upload.metadata", { default: "File Metadata" })}>
          <div style={{ marginTop: '1rem' }}>
            <TextInput
              id="alt-text"
              labelText={t("attachments.upload.altText", { default: "Alt Text" })}
              value={formData.altText}
              onChange={(e) => updateFormField('altText', e.target.value)}
              placeholder={t("attachments.upload.altTextPlaceholder", { default: "Alternative text for accessibility" })}
              disabled={isUploading}
            />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <TextArea
              id="description"
              labelText={t("attachments.upload.description", { default: "Description" })}
              value={formData.description}
              onChange={(e) => updateFormField('description', e.target.value)}
              placeholder={t("attachments.upload.descriptionPlaceholder", { default: "Optional description of the file" })}
              disabled={isUploading}
              rows={3}
            />
          </div>
        </FormGroup>
      )}

      {/* Upload Actions */}
      {canUpload && (
        <div className="upload-actions">
          <Button
            kind="primary"
            renderIcon={Upload}
            onClick={handleUpload}
            disabled={isUploading}
            size="lg"
          >
            {t("attachments.upload.upload", { default: "Upload Files" })}
          </Button>
        </div>
      )}
    </div>
  );
};
