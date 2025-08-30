"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button, Layer, Breadcrumb, BreadcrumbItem, Dropdown, ButtonSet } from "@carbon/react";
import { SidePanel, CreateSidePanel, unstable_FeatureFlags as FeatureFlags } from "@carbon/ibm-products";
import "@/lib/ibm-products/config";
import { Add, ArrowLeft, Close, Reset } from "@carbon/icons-react";
import { useTranslations } from "next-intl";
import { DocumentList } from "./document-list";
import { DocumentForm } from "./document-form";
import { useDocumentStore } from "../stores/document-store";
import { useDocuments } from "../hooks/use-document-queries";
import "../styles/documents.css";

// Flags are set by importing the config above

export const DocumentContainer: React.FC = () => {
  const t = useTranslations("documents");
  const hasLoadedRef = useRef(false);

  const {
    panelOpen,
    panelMode,
    panelDocument,
    openCreatePanel,
    openEditPanel,
    closePanel,
    isSubmitting,
    setSubmitting,
  } = useDocumentStore();

  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "archived" | "expired">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const handleCreateNew = () => openCreatePanel();

  const handleEdit = (document: any) => openEditPanel(document);

  const handleView = async (document: any) => {
    try {
      console.log('👀 Getting preview URL for document view:', document.id);
      // Try admin endpoint first, fallback to public if needed
      let presignedResponse;
      try {
        const { DocumentService } = await import('../services/document-service');
        presignedResponse = await DocumentService.getAdminPreviewUrl(document.id, 3600); // 1 hour expiry for preview
      } catch (adminError) {
        console.log('Admin preview URL failed, trying public URL:', adminError);
        const { DocumentService } = await import('../services/document-service');
        presignedResponse = await DocumentService.getPublicPreviewUrl(document.id, 3600);
      }
      
      if (presignedResponse?.previewUrl) {
        console.log('✅ Opening document with preview URL:', presignedResponse.previewUrl);
        window.open(presignedResponse.previewUrl, '_blank');
      } else {
        console.warn('No preview URL in response, trying download URL:', presignedResponse);
        // Fallback to download URL if no preview URL
        try {
          const { DocumentService } = await import('../services/document-service');
          const downloadResponse = await DocumentService.getAdminDownloadUrl(document.id);
          if (downloadResponse?.downloadUrl) {
            window.open(downloadResponse.downloadUrl, '_blank');
          }
        } catch (downloadError) {
          console.error('Download URL fallback also failed:', downloadError);
        }
      }
    } catch (error) {
      console.error('Failed to get preview URL for document view:', error);
      // Ultimate fallback to direct downloadUrl if available
      if (document.downloadUrl) {
        window.open(document.downloadUrl, '_blank');
      } else {
        alert('Unable to open document. Please try again.');
      }
    }
  };

  const handleDelete = (document: any) => {
    // Add confirmation dialog for delete
    const confirmed = window.confirm(
      `Are you sure you want to delete "${document.title?.en || document.title?.ne || document.originalName}"?`
    );
    if (confirmed) {
      // Delete functionality will be handled by the DocumentList component's mutation
      console.log('Delete confirmed for document:', document.id);
    }
  };

  const handleBackToList = () => closePanel();

  const handleFormSuccess = () => closePanel();

  const handleResetFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
    setTypeFilter("all");
  };

  const panelTitle = panelMode === "edit" ? t("form.editTitle") : t("form.createTitle");

  return (
    <Layer className="document-container">
      {/* Page Header */}
      <div style={{ padding: "2rem 1rem 1rem 1rem" }}>
        <Breadcrumb noTrailingSlash style={{ marginBottom: "1.5rem" }}>
          <BreadcrumbItem href="#">{t("breadcrumbs.home", { default: "Home" })}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t("title")}</BreadcrumbItem>
        </Breadcrumb>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "2rem", fontWeight: "400", margin: "0 0 0.5rem 0", textAlign: "left" }}>
              {t("title", { default: "Documents" })}
            </h1>
            <p style={{ margin: "0", color: "var(--cds-text-secondary, #525252)", textAlign: "left" }}>
              {t("subtitle", { default: "Manage official documents, reports, forms and policies." })}
            </p>
          </div>
          
          <Button size="lg" renderIcon={Add} onClick={handleCreateNew} kind="primary">
            {t("actions.createNew")}
          </Button>
        </div>
      </div>


      {/* Filters */}
      <div style={{ padding: "0 1rem 1rem 1rem", display: "flex", gap: "1rem", alignItems: "center", justifyContent: "flex-end" }}>
        <Dropdown
          id="document-status-dropdown"
          size="md"
          label={t("filters.status")}
          titleText={t("filters.status")}
          items={[
            { id: "all", label: t("filters.all") },
            { id: "draft", label: t("status.draft") },
            { id: "published", label: t("status.published") },
            { id: "archived", label: t("status.archived") },
            { id: "expired", label: t("status.expired") },
          ]}
          selectedItem={{ id: statusFilter, label: statusFilter === "all" ? t("filters.all") : t(`status.${statusFilter}`) }}
          itemToString={(item) => (item ? item.label : "")}
          onChange={({ selectedItem }) => setStatusFilter((selectedItem?.id || "all") as any)}
        />
        
        <Dropdown
          id="document-category-dropdown"
          size="md"
          label={t("filters.category")}
          titleText={t("filters.category")}
          items={[
            { id: "all", label: t("filters.all") },
            { id: "OFFICIAL", label: t("categories.official") },
            { id: "REPORT", label: t("categories.report") },
            { id: "FORM", label: t("categories.form") },
            { id: "POLICY", label: t("categories.policy") },
            { id: "PROCEDURE", label: t("categories.procedure") },
            { id: "GUIDELINE", label: t("categories.guideline") },
            { id: "NOTICE", label: t("categories.notice") },
            { id: "CIRCULAR", label: t("categories.circular") },
            { id: "OTHER", label: t("categories.other") },
          ]}
          selectedItem={{ id: categoryFilter, label: categoryFilter === "all" ? t("filters.all") : t(`categories.${categoryFilter.toLowerCase()}`) }}
          itemToString={(item) => (item ? item.label : "")}
          onChange={({ selectedItem }) => setCategoryFilter((selectedItem?.id || "all") as any)}
        />
        
        <Dropdown
          id="document-type-dropdown"
          size="md"
          label={t("filters.type")}
          titleText={t("filters.type")}
          items={[
            { id: "all", label: t("filters.all") },
            { id: "PDF", label: "PDF" },
            { id: "DOC", label: "DOC" },
            { id: "DOCX", label: "DOCX" },
            { id: "XLS", label: "XLS" },
            { id: "XLSX", label: "XLSX" },
            { id: "PPT", label: "PPT" },
            { id: "PPTX", label: "PPTX" },
            { id: "TXT", label: "TXT" },
            { id: "OTHER", label: t("filters.other") },
          ]}
          selectedItem={{ id: typeFilter, label: typeFilter === "all" ? t("filters.all") : typeFilter }}
          itemToString={(item) => (item ? item.label : "")}
          onChange={({ selectedItem }) => setTypeFilter((selectedItem?.id || "all") as any)}
        />
        
        <Button 
          kind="ghost" 
          size="md" 
          renderIcon={Reset} 
          onClick={handleResetFilters}
          disabled={statusFilter === "all" && categoryFilter === "all" && typeFilter === "all"}
        >
          {t("filters.reset")}
        </Button>
      </div>

      {/* Main Content */}
      <div style={{ padding: "0 1rem 2rem 1rem", textAlign: "left" }}>
        <DocumentList 
          onEdit={handleEdit}
          onView={handleView}
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          typeFilter={typeFilter}
        />
      </div>

      {/* Right side panel for create/edit */}
      <FeatureFlags enableSidepanelResizer>
      <CreateSidePanel
        title={panelTitle}
        subtitle={panelMode === "edit" ? panelDocument?.title?.en : undefined}
        open={panelOpen}
        onRequestClose={() => {
          if (!isSubmitting) {
            closePanel();
          }
        }}
        primaryButtonText={
          isSubmitting
            ? panelMode === 'edit'
              ? t('actions.updating')
              : t('actions.creating')
            : panelMode === 'edit'
              ? t('actions.update')
              : t('actions.createNew')
        }
        secondaryButtonText={t('actions.cancel')}
        onRequestSubmit={() => {
          if (isSubmitting) return;
          setSubmitting(true);
          const formContainer = document.getElementById('document-form');
          
          if (formContainer) {
            const form = formContainer.closest('form') as HTMLFormElement;
            if (form) {
              const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
              form.dispatchEvent(submitEvent);
            } else {
              const customSubmitEvent = new CustomEvent('formSubmit', { bubbles: true });
              formContainer.dispatchEvent(customSubmitEvent);
            }
          } else {
            setSubmitting(false);
          }
        }}
        selectorPageContent="#main-content"
        formTitle={t('sections.basicInfo')}
        selectorPrimaryFocus="input, textarea, [tabindex]:not([tabindex='-1'])"
      >
        <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", zIndex: 10 }}>
          <Button
            kind="ghost"
            hasIconOnly
            size="sm"
            iconDescription={t("actions.cancel")}
            onClick={closePanel}
            renderIcon={Close}
          />
        </div>
        
        <div style={{ padding: 0 }}>
          <DocumentForm mode={panelMode} document={panelDocument as any} onSuccess={handleFormSuccess} onCancel={closePanel} />
        </div>
      </CreateSidePanel>
      </FeatureFlags>
    </Layer>
  );
};
