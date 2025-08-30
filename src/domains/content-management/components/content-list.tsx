"use client";

import React from "react";
import { 
  Tag, 
  OverflowMenu, 
  OverflowMenuItem, 
  InlineLoading,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Toggle,
  Button,
} from "@carbon/react";
import { 
  OverflowMenuVertical,
  Image,
  Document,
  Calendar,
  User,
  Attachment,
} from "@carbon/icons-react";
import { useTranslations } from "next-intl";
import { useDeleteContent } from "../hooks/use-content-queries";
import { ContentNotificationService } from "../services/content-notification-service";
import { Content, ContentStatus, ContentVisibility } from "../types/content";
import "../styles/content-management.css";

interface ContentListProps {
  onEdit: (content: Content) => void;
  onCreate: () => void;
  onManageAttachments: (contentId: string) => void;
  contents: Content[];
  isLoading: boolean;
}

export const ContentList: React.FC<ContentListProps> = ({ 
  onEdit, 
  onCreate,
  onManageAttachments,
  contents,
  isLoading
}) => {
  const t = useTranslations("content-management");
  const deleteMutation = useDeleteContent();

  // Get status color
  const getStatusColor = (status: ContentStatus): "blue" | "green" | "gray" | "purple" => {
    switch (status) {
      case 'PUBLISHED': return 'green';
      case 'DRAFT': return 'blue';
      case 'ARCHIVED': return 'gray';
      default: return 'gray';
    }
  };

  // Get visibility color
  const getVisibilityColor = (visibility: ContentVisibility): "blue" | "green" | "red" => {
    switch (visibility) {
      case 'public': return 'green';
      case 'private': return 'red';
      case 'role-based': return 'blue';
      default: return 'blue';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Handle content actions
  const handleEdit = (content: Content) => {
    onEdit(content);
  };

  const handleDelete = (content: Content) => {
    const contentTitle = getDisplayTitle(content);
    ContentNotificationService.showDeleteConfirmation(
      contentTitle,
      () => {
        deleteMutation.mutate(content.id);
      }
    );
  };

  // Handle attachment management
  const handleManageAttachments = (contentId: string) => {
    onManageAttachments(contentId);
  };

  // Get display title (prefer English, fallback to Nepali)
  const getDisplayTitle = (content: Content) => {
    if (content.title?.en) return content.title.en;
    if (content.title?.ne) return content.title.ne;
    return content.slug || 'Untitled';
  };

  // Get display excerpt (prefer English, fallback to Nepali)
  const getDisplayExcerpt = (content: Content) => {
    if (content.excerpt?.en) return content.excerpt.en;
    if (content.excerpt?.ne) return content.excerpt.ne;
    return '';
  };

  // Get category display name
  const getCategoryDisplayName = (content: Content) => {
    if (content.category?.name?.en) return content.category.name.en;
    if (content.category?.name?.ne) return content.category.name.ne;
    if (content.category?.slug) return content.category.slug;
    return 'Uncategorized';
  };

  // Get author display name
  const getAuthorDisplayName = (content: Content) => {
    if (content.createdBy?.firstName && content.createdBy?.lastName) {
      return `${content.createdBy.firstName} ${content.createdBy.lastName}`;
    }
    if (content.createdBy?.firstName) return content.createdBy.firstName;
    if (content.createdBy?.lastName) return content.createdBy.lastName;
    if (content.createdBy?.email) return content.createdBy.email;
    return 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="content-loading">
        <InlineLoading description={t("status.loading")} />
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-content">
          <div className="empty-state-icon">
            <Document size={48} />
          </div>
          <h3 className="empty-state-title">{t("empty.title")}</h3>
          <p className="empty-state-description">{t("empty.message")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-list-view">
      <DataTable rows={contents} headers={[
        { key: 'title', header: t("table.headers.title") },
        { key: 'slug', header: t("table.headers.slug") },
        { key: 'category', header: t("table.headers.category") },
        { key: 'status', header: t("table.headers.status") },
        { key: 'order', header: t("table.headers.order") },
        { key: 'author', header: t("table.headers.author") },
        { key: 'createdAt', header: t("table.headers.createdAt") },
        { key: 'views', header: t("table.headers.views") },
        { key: 'attachments', header: t("table.headers.attachments", { default: "Attachments" }) },
        { key: 'actions', header: t("table.headers.actions") }
      ]} size="lg">
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <Table {...getTableProps()} useZebraStyles={false}>
            <TableHead>
              <TableRow>
                {headers.map((header) => {
                  const headerProps = getHeaderProps({ header });
                  const { key, ...otherHeaderProps } = headerProps;
                  return (
                    <TableHeader key={key} {...otherHeaderProps}>
                      <span className="table-header-text">{header.header}</span>
                    </TableHeader>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {contents.map((content, index) => {
                // Add safety check for content data
                if (!content || typeof content !== 'object') {
                  return null;
                }
                
                return (
                  <TableRow key={content.id || index}>
                    <TableCell>
                      <div className="content-title-cell">
                        {content.featuredImageId && (
                          <div className="content-thumbnail">
                            <div className="content-image-placeholder">
                              <Image size={24} />
                            </div>
                          </div>
                        )}
                        <div className="content-title-info">
                          <div className="content-title">
                            {getDisplayTitle(content)}
                          </div>
                          {getDisplayExcerpt(content) && (
                            <div className="content-excerpt">
                              {getDisplayExcerpt(content)}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="content-slug">
                        <Tag type="warm-gray" size="sm" className="slug-tag">
                          {content.slug || 'No slug'}
                        </Tag>
                      </div>
                    </TableCell>
                    <TableCell>
                      {content.category && (
                        <Tag type="blue" size="sm">
                          {getCategoryDisplayName(content)}
                        </Tag>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tag type={getStatusColor(content.status)} size="sm">
                        {t(`status.${content.status?.toLowerCase() || 'draft'}`)}
                      </Tag>
                    </TableCell>
                    <TableCell>
                      <div className="content-order">
                        <span className="order-number">{content.order || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {content.createdBy && (
                        <div className="content-author">
                          <User size={16} />
                          <span>{getAuthorDisplayName(content)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="content-date">
                        <Calendar size={16} />
                        <span>{formatDate(content.createdAt || new Date().toISOString())}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="content-views">
                        <Tag type="teal" size="sm" className="views-tag">
                          {content.viewCount || 0}
                        </Tag>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        kind="ghost"
                        size="sm"
                        renderIcon={Attachment}
                        onClick={() => handleManageAttachments(content.id)}
                        iconDescription={t("table.actions.manageAttachments", { default: "Manage Attachments" })}
                      >
                        {t("table.actions.attachments", { default: "Attachments" })}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <OverflowMenu
                        flipped
                        size="sm"
                        aria-label={t('table.actions.menu')}
                        renderIcon={OverflowMenuVertical}
                      >
                        <OverflowMenuItem
                          itemText={t('table.actions.edit')}
                          onClick={() => handleEdit(content)}
                        />
                        <OverflowMenuItem
                          hasDivider
                          isDelete
                          itemText={t('table.actions.delete')}
                          onClick={() => handleDelete(content)}
                        />
                      </OverflowMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DataTable>
    </div>
  );
}; 