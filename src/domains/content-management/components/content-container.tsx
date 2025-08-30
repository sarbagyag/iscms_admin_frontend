"use client";

import React, { useState, useCallback } from "react";
import {
  Button,
  Layer,
  Breadcrumb,
  BreadcrumbItem,
  Search,
} from "@carbon/react";
import {
  CreateSidePanel,
  unstable_FeatureFlags as FeatureFlags,
} from "@carbon/ibm-products";
import "@/lib/ibm-products/config";
import { Add, Close } from "@carbon/icons-react";
import { useTranslations } from "next-intl";
import { ContentList } from "./content-list";
import { CategoryList } from "./categories/category-list";
import { CategoryForm } from "./categories/category-form";
import { ContentForm } from "./content-form";
import { AttachmentList } from "./attachments/attachment-list";
import { useContentStore } from "@/domains/content-management/stores/content-store";
import { useAttachmentStore } from "@/domains/content-management/stores/attachment-store";
import { useAdminContents } from "@/domains/content-management/hooks/use-content-queries";
import type { ContentQuery } from "@/domains/content-management/types/content";
import "@/domains/content-management/styles/content-management.css";

// Flags are set by importing the config above

export const ContentContainer: React.FC = () => {
  const t = useTranslations("content-management");
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentQuery, setCurrentQuery] = useState<ContentQuery>({
    page: 1,
    limit: 12,
    filters: {}
  });

  // Attachment modal state
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedContentIdForModal, setSelectedContentIdForModal] = useState<string | null>(null);

  // Use TanStack Query for data fetching
  const { data: contentResponse, isLoading, error } = useAdminContents(currentQuery);
  
  const contents = contentResponse?.data || [];
  const pagination = contentResponse?.pagination || {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };

  // Use UI store for panel management and form state
  const {
    panelOpen,
    panelMode,
    panelContent,
    panelCategory,
    activeEntity,
    isSubmitting,
    openCreateContentPanel,
    openEditContentPanel,
    openCreateCategoryPanel,
    closePanel,
  } = useContentStore();

  // Use attachment store for attachment management
  const { setSelectedContentId } = useAttachmentStore();

  // Get active entity based on selected tab
  const currentActiveEntity = selectedTabIndex === 0 ? 'content' : 'category';

  const handleCreateNew = useCallback(() => {
    if (selectedTabIndex === 0) {
      openCreateContentPanel();
    } else {
      openCreateCategoryPanel();
    }
  }, [selectedTabIndex, openCreateContentPanel, openCreateCategoryPanel]);

  const handleEdit = useCallback((content: import("@/domains/content-management/types/content").Content) =>
    openEditContentPanel(content), [openEditContentPanel]);

  // Handle attachment management
  const handleManageAttachments = useCallback((contentId: string) => {
    setSelectedContentIdForModal(contentId);
    setSelectedContentId(contentId); // Set in attachment store
    setShowAttachmentModal(true);
  }, [setSelectedContentId]);

  // Close attachment modal
  const handleCloseAttachmentModal = useCallback(() => {
    setShowAttachmentModal(false);
    setSelectedContentIdForModal(null);
    setSelectedContentId(null); // Clear from attachment store
  }, [setSelectedContentId]);

  const handleFormSuccess = useCallback(() => {
    closePanel();
    // TanStack Query will automatically refetch data when mutations succeed
  }, [closePanel]);

  const handleRequestSubmit = useCallback(() => {
    // Handle form submission - use the same pattern as slider container
    const formContainer = document.getElementById('content-form');
    
    if (formContainer) {
      const form = formContainer.closest('form') as HTMLFormElement;
      if (form) {
        const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
        form.dispatchEvent(submitEvent);
      } else {
        const customSubmitEvent = new CustomEvent('formSubmit', { bubbles: true });
        formContainer.dispatchEvent(customSubmitEvent);
      }
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentQuery(prev => ({ ...prev, page }));
  }, []);

  const handleSearch = useCallback((search: string) => {
    setSearchTerm(search);
    setCurrentQuery(prev => ({
      ...prev,
      page: 1,
      filters: { 
        ...prev.filters, 
        search 
      }
    }));
  }, []);

  const panelTitle =
    activeEntity === "category"
      ? panelMode === "edit"
        ? t("categories.form.editTitle", { default: "Edit Category" })
        : t("categories.form.createTitle", { default: "Create Category" })
      : panelMode === "edit"
        ? t("form.editTitle")
        : t("form.createTitle");

  return (
    <Layer className="content-management-container">
      {/* Page Header */}
      <div style={{ padding: "2rem 1rem 1rem 1rem" }}>
        <Breadcrumb noTrailingSlash style={{ marginBottom: "1.5rem" }}>
          <BreadcrumbItem href="#">
            {t("breadcrumbs.home", { default: "Home" })}
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t("title")}</BreadcrumbItem>
        </Breadcrumb>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: "400",
                margin: "0 0 0.5rem 0",
                textAlign: "left",
              }}
            >
              {t("title", { default: "Content Management" })}
            </h1>
            <p
              style={{
                margin: "0",
                color: "var(--cds-text-secondary, #525252)",
                textAlign: "left",
              }}
            >
              {t("subtitle", {
                default: "Manage your content, articles, and pages.",
              })}
            </p>
          </div>

          <Button
            size="lg"
            renderIcon={Add}
            onClick={handleCreateNew}
            kind="primary"
          >
            {selectedTabIndex === 0
              ? t("actions.createNew")
              : t("categories.actions.createNew", {
                  default: "Create Category",
                })}
          </Button>
        </div>
      </div>

      {/* Error Notification */}
      {error && (
        <div className="error-notification">
          <div className="notification-content">
            <div>
              <h4>Error</h4>
              <p>{error instanceof Error ? error.message : String(error)}</p>
            </div>
            <button className="notification-close" onClick={() => {}}>
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation (Content / Categories) */}
      <div >
        <div className="hr-main-tabs">
          <button
            type="button"
            className={`hr-tab-button ${selectedTabIndex === 0 ? "active" : ""}`}
            onClick={() => setSelectedTabIndex(0)}
          >
            {t("list.title", { default: "Contents" })}
          </button>
          <button
            type="button"
            className={`hr-tab-button ${selectedTabIndex === 1 ? "active" : ""}`}
            onClick={() => setSelectedTabIndex(1)}
          >
            {t("categories.list.title", { default: "Categories" })}
          </button>
        </div>
      </div>

      {/* Search & quick actions (aligned with Office Description page) */}
      <div style={{ padding: "0 1rem 1rem 1rem" }}>
        {/* <div style={{ marginBottom: "0.75rem" }} className="search-box">
          <Search
            id="content-search"
            size="lg"
            labelText={t("filters.search")}
            placeholder={t("filters.searchPlaceholder")}
            closeButtonLabelText={t("filters.reset")}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div> */}
      </div>


      {/* Tab Content */}
      <div style={{ padding: "0 1rem 1rem 1rem" }}>
        {selectedTabIndex === 0 ? (
          <ContentList
            onEdit={handleEdit}
            onCreate={handleCreateNew}
            onManageAttachments={handleManageAttachments}
            contents={contents}
            isLoading={isLoading}
          />
        ) : (
          <CategoryList onCreate={handleCreateNew} />
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div
          style={{
            padding: "0 1rem 2rem 1rem",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <Button
              kind="ghost"
              disabled={!pagination.hasPrev}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              kind="ghost"
              disabled={!pagination.hasNext}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Side Panel */}
      <FeatureFlags enableSidepanelResizer={true}>
        <CreateSidePanel
          open={panelOpen}
          onRequestClose={() => {
            if (!isSubmitting) {
              closePanel();
            }
          }}
          onRequestSubmit={handleRequestSubmit}
          title={panelTitle}
          primaryButtonText={
            isSubmitting
              ? activeEntity === "category"
                ? panelMode === 'edit'
                  ? t('categories.actions.updating', { default: 'Updating...' })
                  : t('categories.actions.creating', { default: 'Creating...' })
                : panelMode === 'edit'
                  ? t('actions.updating', { default: 'Updating...' })
                  : t('actions.creating', { default: 'Creating...' })
              : activeEntity === "category"
                ? panelMode === "edit"
                  ? t("categories.form.update", { default: "Update" })
                  : t("categories.form.create", { default: "Create" })
                : panelMode === "edit"
                  ? t("form.update")
                  : t("form.create")
          }
          secondaryButtonText={t("form.cancel")}
          id="cm-sidepanel"
          formTitle={
            activeEntity === "category"
              ? t("categories.sections.basicInfo", {
                  default: "Basic Information",
                })
              : t("sections.basicInfo")
          }
          selectorPageContent="#main-content"
          selectorPrimaryFocus="input, textarea, [tabindex]:not([tabindex='-1'])"
        >
          <div
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
              zIndex: 10,
            }}
          >
            <Button
              kind="ghost"
              hasIconOnly
              size="sm"
              iconDescription={t("actions.cancel")}
              onClick={closePanel}
              renderIcon={Close}
            />
          </div>
          <div id="cm-form-anchor">
            {activeEntity === "content" ? (
              <ContentForm
                mode={panelMode}
                content={panelContent}
                onSuccess={handleFormSuccess}
                onCancel={closePanel}
              />
            ) : (
              <CategoryForm
                mode={panelMode}
                category={panelCategory}
                onSuccess={handleFormSuccess}
                onCancel={closePanel}
              />
            )}
          </div>
        </CreateSidePanel>
      </FeatureFlags>

      {/* Attachment Management Side Panel */}
      <FeatureFlags enableSidepanelResizer>
        <CreateSidePanel
          title={t("attachments.modal.title", { default: "Manage Attachments" })}
          subtitle={t("attachments.modal.subtitle", { default: "Upload and manage content attachments" })}
          open={showAttachmentModal}
          onRequestClose={handleCloseAttachmentModal}
          primaryButtonText={t("attachments.modal.close", { default: "Close" })}
          secondaryButtonText={t("attachments.modal.cancel", { default: "Cancel" })}
          onRequestSubmit={handleCloseAttachmentModal}
          selectorPageContent="#main-content"
          formTitle={t("attachments.modal.formTitle", { default: "Attachment Management" })}
          selectorPrimaryFocus="input, textarea, [tabindex]:not([tabindex='-1'])"
        >
          <div style={{ padding: 0, background: 'white' }}>
            {selectedContentIdForModal && (
              <AttachmentList 
                className="sidepanel-attachment-list"
              />
            )}
          </div>
        </CreateSidePanel>
      </FeatureFlags>
    </Layer>
  );
};
