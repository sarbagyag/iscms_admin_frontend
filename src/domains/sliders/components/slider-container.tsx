"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button, Layer, Breadcrumb, BreadcrumbItem, Dropdown, ButtonSet } from "@carbon/react";
import { SidePanel, CreateSidePanel, unstable_FeatureFlags as FeatureFlags } from "@carbon/ibm-products";
import "@/lib/ibm-products/config";
import { Add, ArrowLeft, Close, Reset } from "@carbon/icons-react";
import { useTranslations } from "next-intl";
import { SliderList } from "./slider-list";
import { SliderForm } from "./slider-form";
import { useSliderStore } from "../stores/slider-store";
import { useSliders } from "../hooks/use-slider-queries";
import "../styles/sliders.css";

// Flags are set by importing the config above

export const SliderContainer: React.FC = () => {
  const t = useTranslations("sliders");
  const hasLoadedRef = useRef(false);

  const {
    panelOpen,
    panelMode,
    panelSlider,
    openCreatePanel,
    openEditPanel,
    closePanel,
    isSubmitting,
    setSubmitting,
  } = useSliderStore();

  const { data: listData, isLoading } = useSliders({ page: 1, limit: 12 });
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const handleCreateNew = () => openCreatePanel();

  const handleEdit = (slider: any) => openEditPanel(slider);

  const handleBackToList = () => closePanel();

  const handleFormSuccess = () => closePanel();

  const handleResetFilters = () => {
    setStatusFilter("all");
  };

  const panelTitle = panelMode === "edit" ? t("form.editTitle") : t("form.createTitle");

  return (
    <Layer className="slider-container">
      {/* Page Header */}
      <div style={{ padding: "2rem 1rem 1rem 1rem" }}>
        <Breadcrumb noTrailingSlash style={{ marginBottom: "1.5rem" }}>
          <BreadcrumbItem href="#">{t("breadcrumbs.home", { default: "Home" })}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t("title")}</BreadcrumbItem>
        </Breadcrumb>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "2rem", fontWeight: "400", margin: "0 0 0.5rem 0", textAlign: "left" }}>
              {t("title", { default: "Sliders" })}
            </h1>
            <p style={{ margin: "0", color: "var(--cds-text-secondary, #525252)", textAlign: "left" }}>
              {t("subtitle", { default: "Manage homepage sliders, images and visibility." })}
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
          id="slider-status-dropdown"
          size="md"
          label={t("filters.status")}
          titleText={t("filters.status")}
          items={[
            { id: "all", label: t("filters.all") },
            { id: "active", label: t("status.active") },
            { id: "inactive", label: t("status.inactive") },
          ]}
          selectedItem={{ id: statusFilter, label: statusFilter === "all" ? t("filters.all") : statusFilter === "active" ? t("status.active") : statusFilter === "inactive" ? t("status.inactive") : "" }}
          itemToString={(item) => (item ? item.label : "")}
          onChange={({ selectedItem }) => setStatusFilter((selectedItem?.id || "all") as any)}
        />
        
        <Button 
          kind="ghost" 
          size="md" 
          renderIcon={Reset} 
          onClick={handleResetFilters}
          disabled={statusFilter === "all"}
        >
          {t("filters.reset")}
        </Button>
      </div>

      {/* Main Content */}
      <div style={{ padding: "0 1rem 2rem 1rem", textAlign: "left" }}>
        <SliderList onEdit={handleEdit} statusFilter={statusFilter} />
      </div>

      {/* Right side panel for create/edit */}
      <FeatureFlags enableSidepanelResizer>
      <CreateSidePanel
        title={panelTitle}
        subtitle={panelMode === "edit" ? panelSlider?.title?.en : undefined}
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
          const formContainer = document.getElementById('slider-form');
          
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
          <SliderForm mode={panelMode} slider={panelSlider as any} onSuccess={handleFormSuccess} onCancel={closePanel} />
        </div>
      </CreateSidePanel>
      </FeatureFlags>
    </Layer>
  );
};
