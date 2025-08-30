"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Grid,
  Column,
  Tile,
  Button,
  Tag,
  InlineLoading,
  OverflowMenu,
  OverflowMenuItem,
} from "@carbon/react";
import {
  Edit,
  TrashCan,
  View,
  Settings,
  Image,
  Checkmark,
  Close,
} from "@carbon/icons-react";
import { useTranslations } from "next-intl";
import { HeaderConfig } from "../types/header";
import {
  useHeaders,
  useDeleteHeader,
  usePublishHeader,
  useUnpublishHeader,
} from "../hooks/use-header-queries";
import { useHeaderStore } from "../stores/header-store";
import { HeaderService } from "../services/header-service";
import { HeaderLogoPreview } from "./header-logo-preview";
import MediaUrlService from "@/services/media-url-service";

interface HeaderListProps {
  headers?: HeaderConfig[];
  onEdit?: (header: HeaderConfig) => void;
  onView?: (header: HeaderConfig) => void;
  onPreview?: (header: HeaderConfig) => void;
  onCreate?: () => void;
  statusFilter?: "all" | "active" | "inactive" | "published" | "unpublished";
  className?: string;
}

export const HeaderList: React.FC<HeaderListProps> = ({
  headers: propHeaders,
  onEdit,
  onView,
  onPreview,
  onCreate,
  statusFilter = "all",
  className = "",
}) => {
  const t = useTranslations("headers");
  const { openCreatePanel, openEditPanel } = useHeaderStore();

  // API queries - only fetch first page with limit 1 since we only need one header
  const {
    data: headersData,
    isLoading,
    error,
  } = useHeaders({
    page: 1,
    limit: 1,
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
  });

  const deleteHeaderMutation = useDeleteHeader();
  const publishHeaderMutation = usePublishHeader();
  const unpublishHeaderMutation = useUnpublishHeader();

  // Get the first (and only) header from the data
  const header = headersData?.data?.[0] || propHeaders?.[0];

  // Handle individual header actions
  const handleEdit = useCallback(
    (header: HeaderConfig) => {
      openEditPanel(header);
      onEdit?.(header);
    },
    [openEditPanel, onEdit]
  );

  const handleView = useCallback(
    (header: HeaderConfig) => {
      onView?.(header);
    },
    [onView]
  );

  const handlePreview = useCallback(
    (header: HeaderConfig) => {
      onPreview?.(header);
    },
    [onPreview]
  );

  const handleDelete = useCallback(
    async (header: HeaderConfig) => {
      try {
        await deleteHeaderMutation.mutateAsync(header.id);
      } catch (error) {
        console.error("Delete failed:", error);
      }
    },
    [deleteHeaderMutation]
  );

  const handlePublish = useCallback(
    async (header: HeaderConfig) => {
      try {
        await publishHeaderMutation.mutateAsync(header.id);
      } catch (error) {
        console.error("Publish failed:", error);
      }
    },
    [publishHeaderMutation]
  );

  const handleUnpublish = useCallback(
    async (header: HeaderConfig) => {
      try {
        await unpublishHeaderMutation.mutateAsync(header.id);
      } catch (error) {
        console.error("Unpublish failed:", error);
      }
    },
    [unpublishHeaderMutation]
  );

  // Render header card
  const renderHeaderCard = (header: HeaderConfig) => {
    const hasLeftLogo = !!header.logo?.leftLogo?.mediaId;
    const hasRightLogo = !!header.logo?.rightLogo?.mediaId;

    // Debug logging
    console.log("🔍 HeaderList - Header data:", {
      id: header.id,
      name: header.name,
      leftLogo: header.logo?.leftLogo,
      rightLogo: header.logo?.rightLogo,
      hasLeftLogo,
      hasRightLogo,
    });

    return (
      <Column key={header.id} lg={16} md={8} sm={4}>
        <Tile className="header-card">
          {/* Card header */}
          <div className="card-header">
            <div className="card-header-content">
              <h3 className="card-title">
                {HeaderService.getDisplayName(header)}
              </h3>
              <p className="card-subtitle">
                Order: {header.order} • {header.alignment?.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Card content */}
          <div className="card-content">
            {/* Logo previews */}
            {(hasLeftLogo || hasRightLogo) && (
              <div className="card-logo-section">
                <div className="card-logo-grid">
                  {hasLeftLogo && (
                    <div className="card-logo-item">
                      {(() => {
                        const leftLogoData =
                          MediaUrlService.getImageSourceFromHeaderLogo(
                            header.logo.leftLogo!
                          );
                        return (
                          <HeaderLogoPreview
                            mediaId={leftLogoData.mediaId}
                            presignedUrl={leftLogoData.directUrl}
                            alt={leftLogoData.alt || "Left logo"}
                            width={header.logo.leftLogo?.width || 200}
                            height={header.logo.leftLogo?.height || 80}
                          />
                        );
                      })()}
                      <p className="card-logo-label">Left Logo</p>
                    </div>
                  )}

                  {hasRightLogo && (
                    <div className="card-logo-item">
                      {(() => {
                        const rightLogoData =
                          MediaUrlService.getImageSourceFromHeaderLogo(
                            header.logo.rightLogo!
                          );
                        return (
                          <HeaderLogoPreview
                            mediaId={rightLogoData.mediaId}
                            presignedUrl={rightLogoData.directUrl}
                            alt={rightLogoData.alt || "Right logo"}
                            width={header.logo.rightLogo?.width || 200}
                            height={header.logo.rightLogo?.height || 80}
                          />
                        );
                      })()}
                      <p className="card-logo-label">Right Logo</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="card-meta">
              <Tag type={header.isActive ? "blue" : "red"} size="sm">
                {header.isActive ? "Active" : "Inactive"}
              </Tag>
              <Tag type={header.isPublished ? "green" : "gray"} size="sm">
                {header.isPublished ? "Published" : "Draft"}
              </Tag>
              {hasLeftLogo && (
                <Tag type="purple" size="sm">
                  Left Logo
                </Tag>
              )}
              {hasRightLogo && (
                <Tag type="purple" size="sm">
                  Right Logo
                </Tag>
              )}
            </div>

            <div className="card-details">
              <p>
                <strong>Font:</strong> {header.typography.fontFamily}{" "}
                {header.typography.fontSize}px
              </p>
              <p>
                <strong>Height:</strong> {header.layout.headerHeight}px
              </p>
              <p>
                <strong>Background:</strong> {header.layout.backgroundColor}
              </p>
            </div>
          </div>

          {/* Card actions */}
          <div className="card-actions">
            <OverflowMenu
              aria-label="Header actions"
              iconDescription="More actions"
              size="sm"
            >
              <OverflowMenuItem
                itemText={t("actions.edit") || "Edit"}
                onClick={() => handleEdit(header)}
              />
              <OverflowMenuItem
                hasDivider
                isDelete
                itemText={t("actions.delete") || "Delete"}
                onClick={() => handleDelete(header)}
              />
            </OverflowMenu>
          </div>
        </Tile>
      </Column>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <InlineLoading
          description={t("status.loading") || "Loading headers..."}
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="error-container">
        <p style={{ color: "var(--cds-support-error)" }}>
          {t("errors.loadFailed") || "Failed to load headers"}
        </p>
      </div>
    );
  }

  // No headers found
  if (!header) {
    return (
      <div className="empty-state">
        <div className="empty-state-content">
          <div className="empty-state-icon">
            <Image size={48} />
          </div>
          <h3 className="empty-state-title">
            {t("empty.title") || "No Header Configuration"}
          </h3>
          <p className="empty-state-description">
            {t("empty.message") ||
              "No header configuration has been set up yet. Create your first header to get started."}
          </p>
          {onCreate && (
            <Button
              kind="primary"
              onClick={onCreate}
              className="empty-state-action"
            >
              {t("actions.createNew") || "Create Header"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Show the single header
  return (
    <div className="header-list">
      <Grid fullWidth>{renderHeaderCard(header)}</Grid>
    </div>
  );
};
