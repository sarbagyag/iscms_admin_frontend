"use client";

import React, { useState, useCallback } from "react";
import { 
  Button, 
  ComboBox, 
  DataTable, 
  Table, 
  TableHead, 
  TableRow, 
  TableHeader, 
  TableBody, 
  TableCell,
  Tag,
  OverflowMenu,
  OverflowMenuItem,
  InlineLoading,
  Tile,
  Pagination,
  Stack,
  FormGroup,
} from "@carbon/react";
import { 
  Add, 
  Download, 
  Edit, 
  TrashCan, 
  Document,
  Image,
  Video,
  Radio,
  Archive,
} from "@carbon/icons-react";
import { useTranslations } from "next-intl";
import { useAttachmentStore } from "../../stores/attachment-store";
import { useAttachmentsWithPresignedUrls, useDeleteAttachment, useDownloadAttachment, useCreateAttachment } from "../../hooks/use-attachment-queries";
import { AttachmentService } from "../../services/attachment-service";
import { AttachmentNotificationService } from "../../services/attachment-notification-service";
import { ContentAttachment } from "../../types/attachment";
import { useAdminContents } from "../../hooks/use-content-queries";
import { AttachmentPreview } from "./attachment-preview";
import "../../styles/content-management.css";

interface AttachmentListProps {
  className?: string;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({ className }) => {
  const t = useTranslations("content-management");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  
  const {
    selectedContentId,
    setSelectedContentId,
  } = useAttachmentStore();

  // Get content list for selector
  const { data: contentResponse } = useAdminContents({ page: 1, limit: 100 });
  const contents = contentResponse?.data || [];

  // Get attachments for selected content with presigned URLs
  const { 
    data: attachmentsResponse, 
    isLoading, 
    error 
  } = useAttachmentsWithPresignedUrls(selectedContentId || "", 86400, !!selectedContentId);

  // Extract attachments from response, with fallback to empty array
  const attachments = attachmentsResponse || [];

  const deleteMutation = useDeleteAttachment();
  const downloadMutation = useDownloadAttachment();
  const createAttachmentMutation = useCreateAttachment();

  // Content selection items for ComboBox
  const contentItems = contents.map(content => ({
    id: content.id,
    title: content.title?.en || content.title?.ne || `Content ${content.id}`,
    description: content.excerpt?.en || content.excerpt?.ne || content.seoDescription?.en || content.seoDescription?.ne || '',
  }));

  // Handle content selection
  const handleContentSelection = useCallback((selection: any) => {
    if (selection?.selectedItem) {
      setSelectedContentId(selection.selectedItem.id);
      setCurrentPage(1); // Reset to first page when content changes
    }
  }, [setSelectedContentId]);

  // Handle attachment actions
  const handleEdit = useCallback((attachment: ContentAttachment) => {
    // Simple edit functionality - prompt for new alt text
    const newAltText = prompt('Enter alt text for this attachment:', attachment.altText || '');
    if (newAltText !== null && newAltText !== attachment.altText) {
      // Here you would call an update mutation
      // For now, just show a message
      alert('Edit functionality will be implemented here');
    }
  }, [deleteMutation]);

  const handleDelete = useCallback((attachment: ContentAttachment) => {
    AttachmentNotificationService.showDeleteConfirmation(
      attachment.fileName,
      () => {
        deleteMutation.mutate(attachment.id, {
          onSuccess: () => {
            AttachmentNotificationService.showAttachmentDeleted(attachment.fileName);
          },
          onError: (error: any) => {
            const errorMessage = error?.message || 'Unknown error occurred';
            AttachmentNotificationService.showAttachmentDeletionError(errorMessage, attachment.fileName);
          }
        });
      }
    );
  }, [deleteMutation]);

  const handleDownload = useCallback((attachment: ContentAttachment) => {
    downloadMutation.mutate(attachment.id, {
      onSuccess: () => {
        AttachmentNotificationService.showAttachmentDownloaded(attachment.fileName);
      },
      onError: (error: any) => {
        const errorMessage = error?.message || 'Unknown error occurred';
        AttachmentNotificationService.showAttachmentDownloadError(errorMessage, attachment.fileName);
      }
    });
  }, [downloadMutation]);

  const handleCreateNew = useCallback(() => {
    if (selectedContentId) {
      // Create a hidden file input and trigger it directly
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.multiple = true;
      fileInput.accept = 'image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.txt,.csv,.xml,.json,.zip,.rar,.7z,.tar,.gz';
      
      fileInput.onchange = async (event) => {
        const files = Array.from((event.target as HTMLInputElement).files || []);
        if (files.length > 0) {
          // Handle file uploads directly here
          await handleDirectFileUpload(files);
        }
        // Clean up
        document.body.removeChild(fileInput);
      };
      
      // Add to DOM temporarily and trigger
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
      fileInput.click();
    }
  }, [selectedContentId]);

  // Handle direct file uploads without opening the panel
  const handleDirectFileUpload = async (files: File[]) => {
    // If no content is selected, show a message to select content first
    if (!selectedContentId) {
      AttachmentNotificationService.showSelectContentFirst();
      return;
    }
    
    // Validate files first
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    files.forEach((file, index) => {
      const validation = AttachmentService.validateFile(file);
      if (!validation.isValid) {
        AttachmentNotificationService.showFileValidationError(file.name, validation.error || "Invalid file");
        errors.push(file.name);
      } else {
        validFiles.push(file);
      }
    });
    
    if (validFiles.length === 0) return;
    
    // Show uploading notification
    let loadingNotificationId: string | null = null;
    if (validFiles.length === 1 && validFiles[0]) {
      loadingNotificationId = AttachmentNotificationService.showUploadingFile(validFiles[0].name);
    } else if (validFiles.length > 1) {
      loadingNotificationId = AttachmentNotificationService.showUploadingMultipleFiles(validFiles.length);
    }
    
    try {
      // Upload each file
      for (const file of validFiles) {
        await createAttachmentMutation.mutateAsync({
          data: {
            contentId: selectedContentId,
            fileName: file.name,
            filePath: '', // This will be set by the backend
            fileSize: file.size,
            mimeType: file.type,
            order: 1,
            originalName: file.name,
            altText: '',
            description: ''
          },
          file: file
        });
      }
      
      // Remove loading notification
      if (loadingNotificationId) {
        AttachmentNotificationService.removeNotification(loadingNotificationId);
      }
      
      // Show success message
      if (validFiles.length === 1 && validFiles[0]) {
        AttachmentNotificationService.showAttachmentUploaded(validFiles[0].name);
      } else if (validFiles.length > 1) {
        AttachmentNotificationService.showMultipleAttachmentsUploaded(validFiles.length);
      }
      
    } catch (error) {
      // Remove loading notification
      if (loadingNotificationId) {
        AttachmentNotificationService.removeNotification(loadingNotificationId);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      if (validFiles.length === 1 && validFiles[0]) {
        AttachmentNotificationService.showAttachmentUploadError(errorMessage, validFiles[0].name);
      } else {
        AttachmentNotificationService.showAttachmentUploadError(errorMessage);
      }
    }
  };

  // Handle file selection from the Basic Info section
  const handleFileSelection = useCallback((files: File[]) => {
    if (files.length > 0) {
      handleDirectFileUpload(files);
    }
  }, [handleDirectFileUpload]);

  // Table headers - simplified to show only essential info
  const headers = [
    { key: 'preview', header: t('attachments.table.preview', { default: 'Preview' }) },
    { key: 'actions', header: t('attachments.table.actions', { default: 'Actions' }) },
  ];

  // Transform attachments for simplified table - only preview and actions
  const rows = attachments.map((attachment: ContentAttachment) => ({
    id: attachment.id,
    preview: (
      <div className="attachment-preview-cell">
        <AttachmentPreview 
          attachment={attachment} 
          className="table-preview"
          showActions={false}
        />
        <div className="attachment-info">
          <div className="file-name">{attachment.fileName}</div>
          <div className="file-meta">
            <span className="file-size">{AttachmentService.formatFileSize(attachment.fileSize)}</span>
            <span className="file-type">
              <Tag type="blue" size="sm">
                {AttachmentService.getFileTypeCategory(attachment.mimeType)}
              </Tag>
            </span>
          </div>
        </div>
      </div>
    ),
    actions: (
      <div className="attachment-actions">
        <Button
          kind="ghost"
          size="sm"
          renderIcon={Download}
          onClick={() => handleDownload(attachment)}
          iconDescription={t('attachments.table.actionItems.download', { default: 'Download' })}
          hasIconOnly
        />
        <Button
          kind="danger--ghost"
          size="sm"
          renderIcon={TrashCan}
          onClick={() => handleDelete(attachment)}
          iconDescription={t('attachments.table.actionItems.delete', { default: 'Delete' })}
          hasIconOnly
        />
      </div>
    ),
  }));

  // Helper function to get file icon
  const getFileIcon = (mimeType: string) => {
    const iconSize = 24;
    switch (AttachmentService.getFileTypeCategory(mimeType)) {
      case 'image':
        return <Image size={iconSize} />;
      case 'video':
        return <Video size={iconSize} />;
      case 'audio':
        return <Radio size={iconSize} />;
      case 'archive':
        return <Archive size={iconSize} />;
      default:
        return <Document size={iconSize} />;
    }
  };

  return (
    <div className={`attachment-list ${className || ''}`}>
      {/* Content Selection */}
      <div className="content-selection-section">
        <div className="content-selector">
          <ComboBox
            id="content-selector"
            items={contentItems}
            itemToString={(item) => item?.title || ''}
            onChange={handleContentSelection}
            placeholder={t('attachments.contentSelector.placeholder', { default: 'Select content to manage attachments...' })}
            size="lg"
            titleText={t('attachments.contentSelector.title', { default: 'Select Content' })}
            helperText={t('attachments.contentSelector.help', { default: 'Choose the content item to manage its attachments' })}
          />
        </div>
        
        {selectedContentId && (
          <Button
            size="lg"
            renderIcon={Add}
            onClick={handleCreateNew}
            kind="primary"
          >
            {t('attachments.actions.upload', { default: 'Upload Files' })}
          </Button>
        )}
      </div>

      {/* Attachments Display */}
      {selectedContentId ? (
        <div className="attachments-display">
          {/* Persistent Upload Button */}
          <div className="upload-section">
            <div className="attachment-upload-form media-multi-upload">
              {/* Basic Info Section */}
              <div className="form-section">
                <h3 className="section-title" style={{ 
                  margin: 0, 
                  marginBottom: '1rem',
                  fontSize: '1.125rem', 
                  fontWeight: 600, 
                  color: 'var(--cds-text-01)' 
                }}>Basic Info</h3>
                <div className="file-upload-area">
                  <FormGroup legendText="File(s)">
                    <Tile className="upload-area" style={{
                      background: 'white !important',
                      border: '2px dashed var(--cds-ui-04)',
                      borderRadius: 0,
                      padding: '2rem',
                      textAlign: 'center',
                      minHeight: '160px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.1s ease',
                      cursor: selectedContentId ? 'pointer' : 'not-allowed'
                    }}>
                      <Stack gap={4} className="upload-content" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        maxWidth: '300px',
                        width: '100%',
                        background: 'transparent !important'
                      }}>
                        <Document size={32} className="upload-icon" style={{ color: 'var(--cds-text-03)' }} />
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>File(s)</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--cds-text-02)' }}>
                          {selectedContentId 
                            ? 'Documents, images, audio files, archives (max 20MB)' 
                            : 'Please select a content item first, then upload files'
                          }
                        </p>
                        <input
                          id="attachment-file-input"
                          type="file"
                          multiple
                          accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.txt,.csv,.xml,.json,.zip,.rar,.7z,.tar,.gz"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) {
                              handleFileSelection(files);
                            }
                          }}
                          style={{ display: 'none' }}
                          disabled={!selectedContentId}
                        />
                        <Button
                          kind="secondary"
                          size="sm"
                          onClick={() => document.getElementById('attachment-file-input')?.click()}
                          renderIcon={Add}
                          disabled={!selectedContentId}
                          style={{
                            backgroundColor: selectedContentId ? '#393939 !important' : 'var(--cds-ui-03) !important',
                            color: selectedContentId ? '#ffffff !important' : 'var(--cds-text-03) !important',
                            border: selectedContentId ? '1px solid #393939 !important' : '1px solid var(--cds-ui-03) !important',
                            minWidth: '140px'
                          }}
                        >
                          {selectedContentId ? 'Choose files' : 'Select content first'}
                        </Button>
                      </Stack>
                    </Tile>
                  </FormGroup>
                </div>
              </div>
            </div>
          </div>

          {attachments.length > 0 ? (
            <>
              <div className="attachments-table">
                <DataTable
                  rows={rows}
                  headers={headers}
                  size="lg"
                  useZebraStyles
                >
                  {({ rows, headers, getTableProps, getTableContainerProps }) => (
                    <Table {...getTableProps()}>
                      <TableHead>
                        <TableRow>
                          {headers.map((header) => (
                            <TableHeader key={header.key}>{header.header}</TableHeader>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.cells.map((cell) => (
                              <TableCell key={cell.id}>{cell.value}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </DataTable>
              </div>

              {/* Pagination */}
              {attachments.length > pageSize && (
                <div className="pagination-container">
                  <Pagination
                    page={currentPage}
                    pageSize={pageSize}
                    pageSizes={[12, 24, 48]}
                    totalItems={attachments.length}
                    onChange={({ page, pageSize: newPageSize }) => {
                      if (page !== undefined) setCurrentPage(page);
                      if (newPageSize !== undefined) setPageSize(newPageSize);
                    }}
                    size="md"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <Tile className="empty-tile">
                <div className="empty-content">
                  <Document size={48} className="empty-icon" />
                  <h3>{t('attachments.empty.title', { default: 'No Attachments' })}</h3>
                  <p>{t('attachments.empty.message', { default: 'This content has no attachments yet. Upload some files to get started.' })}</p>
                </div>
              </Tile>
            </div>
          )}
        </div>
      ) : (
        <div className="no-content-selected">
          <Tile className="no-content-tile">
            <div className="no-content-content">
              <Document size={48} className="no-content-icon" />
              <h3>{t('attachments.noContent.title', { default: 'Select Content' })}</h3>
              <p>{t('attachments.noContent.message', { default: 'Please select a content item from the dropdown above to manage its attachments.' })}</p>
            </div>
          </Tile>
        </div>
      )}

      {/* Upload Panel - Removed since we handle uploads directly */}
      {/* {panelOpen && (
        <AttachmentUpload />
      )} */}
    </div>
  );
};
