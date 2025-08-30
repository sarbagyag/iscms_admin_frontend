"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button, Layer, Breadcrumb, BreadcrumbItem, Dropdown, ButtonSet } from "@carbon/react";
import { SidePanel, CreateSidePanel, unstable_FeatureFlags as FeatureFlags } from "@carbon/ibm-products";
import "@/lib/ibm-products/config";
import { Add, ArrowLeft, Close, Reset, Search, Download, Upload } from "@carbon/icons-react";
import { useTranslations } from "next-intl";
import { ImportantLinksList } from "./important-links-list";
import { ImportantLinksForm } from "./important-links-form";
import { ImportantLinksStatistics } from "./important-links-statistics";
import { useImportantLinksStore } from "../stores/important-links-store";
import { useImportantLinks } from "../hooks/use-important-links-queries";
import "../styles/important-links.css";

// Flags are set by importing the config above

export const ImportantLinksContainer: React.FC = () => {
  const t = useTranslations("important-links");
  const hasLoadedRef = useRef(false);

  const {
    panelOpen,
    panelMode,
    panelLink,
    openCreatePanel,
    openEditPanel,
    closePanel,
    isSubmitting,
    setSubmitting,
  } = useImportantLinksStore();

  const { data: listData, isLoading } = useImportantLinks({ page: 1, limit: 12 });
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showStatistics, setShowStatistics] = useState<boolean>(false);

  const handleCreateNew = () => openCreatePanel();

  const handleEdit = (link: any) => openEditPanel(link);

  const handleBackToList = () => closePanel();

  const handleFormSuccess = () => closePanel();

  const handleResetFilters = () => {
    setStatusFilter("all");
    setSearchTerm("");
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const toggleStatistics = () => {
    setShowStatistics(!showStatistics);
  };

  const panelTitle = panelMode === "edit" ? t("form.editTitle") : t("form.createTitle");

  return (
    <Layer className="important-links-container">
      {/* Page Header */}
      <div style={{ padding: "2rem 1rem 1rem 1rem" }}>
        <Breadcrumb noTrailingSlash style={{ marginBottom: "1.5rem" }}>
          <BreadcrumbItem href="#">{t("breadcrumbs.home", { default: "Home" })}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t("title")}</BreadcrumbItem>
        </Breadcrumb>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "2rem", fontWeight: "400", margin: "0 0 0.5rem 0", textAlign: "left" }}>
              {t("title", { default: "Important Links" })}
            </h1>
            <p style={{ margin: "0", color: "var(--cds-text-secondary, #525252)", textAlign: "left" }}>
              {t("subtitle", { default: "Manage important links, URLs and visibility for the website." })}
            </p>
          </div>
          
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button 
              size="lg" 
              kind="ghost" 
              renderIcon={showStatistics ? undefined : undefined}
              onClick={toggleStatistics}
            >
              {showStatistics ? t("actions.hideStats") : t("actions.showStats")}
            </Button>
            <Button size="lg" renderIcon={Add} onClick={handleCreateNew} kind="primary">
              {t("actions.createNew")}
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      {showStatistics && (
        <div style={{ padding: "0 1rem 1rem 1rem" }}>
          <ImportantLinksStatistics />
        </div>
      )}

      {/* Filters and Search */}
      <div style={{ padding: "0 1rem 1rem 1rem", display: "flex", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Dropdown
            id="link-status-dropdown"
            size="md"
            label={t("filters.status")}
            titleText={t("filters.status")}
            items={[
              { id: "all", label: t("filters.all") },
              { id: "active", label: t("status.active") },
              { id: "inactive", label: t("status.inactive") },
            ]}
            selectedItem={{ 
              id: statusFilter, 
              label: statusFilter === "all" 
                ? t("filters.all") 
                : statusFilter === "active" 
                  ? t("status.active") 
                  : t("status.inactive") 
            }}
            itemToString={(item) => (item ? item.label : "")}
            onChange={({ selectedItem }) => setStatusFilter((selectedItem?.id || "all") as any)}
          />
          
          <Button 
            kind="ghost" 
            size="md" 
            renderIcon={Reset} 
            onClick={handleResetFilters}
            disabled={statusFilter === "all" && !searchTerm}
          >
            {t("filters.reset")}
          </Button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="text"
            placeholder={t("search.placeholder")}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              border: "1px solid var(--cds-ui-04)",
              borderRadius: "0",
              fontSize: "0.875rem",
              minWidth: "200px",
            }}
          />
          {searchTerm && (
            <Button
              kind="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              style={{ padding: "0.25rem" }}
            >
              ×
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: "0 1rem 2rem 1rem", textAlign: "left" }}>
        <ImportantLinksList 
          onEdit={handleEdit} 
          statusFilter={statusFilter} 
          searchTerm={searchTerm}
        />
      </div>

      {/* Right side panel for create/edit */}
      <FeatureFlags enableSidepanelResizer>
      <CreateSidePanel
        title={panelTitle}
        subtitle={panelMode === "edit" ? panelLink?.linkTitle?.en : undefined}
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
          const formContainer = document.getElementById('important-links-form');
          
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
          <ImportantLinksForm 
            mode={panelMode} 
            link={panelLink as any} 
            onSuccess={handleFormSuccess} 
            onCancel={closePanel} 
          />
        </div>
      </CreateSidePanel>
      </FeatureFlags>
    </Layer>
  );
};
