"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button, Layer, Breadcrumb, BreadcrumbItem, Dropdown, ButtonSet } from "@carbon/react";
import { SidePanel, CreateSidePanel, unstable_FeatureFlags as FeatureFlags } from "@carbon/ibm-products";
import "@/lib/ibm-products/config";
import { Add, ArrowLeft, Close, Reset } from "@carbon/icons-react";
import { useTranslations } from "next-intl";
import { MenuList } from "./menu-list";
import { MenuForm } from "./menu-form";
import { MenuItemTree } from "./menu-item-tree";
import { MenuItemFormWrapper } from "./menu-item-form-wrapper";
import { useNavigationStore } from "../stores/navigation-store";
import { useMenus, useDeleteMenuItem } from "../hooks/use-navigation-queries";
import { MenuLocation, Menu, MenuItem } from "../types/navigation";
import { NotificationService } from "@/services/notification-service";
import "../styles/navigation.css";

// Flags are set by importing the config above

export const NavigationContainer: React.FC = () => {
  const t = useTranslations("navigation");
  const hasLoadedRef = useRef(false);

  const {
    panelOpen,
    panelMode,
    panelMenu,
    panelMenuItem,
    openCreatePanel,
    openEditPanel,
    openCreateMenuItemPanel,
    openEditMenuItemPanel,
    closePanel,
    isSubmitting,
    setSubmitting,
  } = useNavigationStore();

  const { data: listData, isLoading } = useMenus({ page: 1, limit: 12 });
  const deleteMenuItemMutation = useDeleteMenuItem();
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [locationFilter, setLocationFilter] = useState<MenuLocation | "all">("all");
  const [currentView, setCurrentView] = useState<"menus" | "menuItems">("menus");
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

  const handleCreateNew = () => openCreatePanel();

  const handleEdit = (menu: any) => openEditPanel(menu);

  const handleBackToList = () => closePanel();

  const handleFormSuccess = () => closePanel();

  // Menu item management handlers
  const handleManageMenuItems = (menu: Menu) => {
    setSelectedMenu(menu);
    setCurrentView("menuItems");
  };

  const handleBackToMenus = () => {
    setCurrentView("menus");
    setSelectedMenu(null);
  };

  const handleCreateMenuItem = (parentId?: string) => {
    if (selectedMenu) {
      openCreateMenuItemPanel(selectedMenu.id);
    }
  };

  const handleEditMenuItem = (menuItem: any) => {
    if (selectedMenu) {
      openEditMenuItemPanel(menuItem);
    }
  };

  const handleMenuItemFormSuccess = () => {
    closePanel();
    // Refresh menu items if needed
  };

  const handleDeleteMenuItem = async (menuItem: MenuItem) => {
    const displayTitle = menuItem.title?.en || menuItem.title?.ne || t('table.noName', { default: 'Untitled' });
    
    if (window.confirm(t('menuItems.delete.confirmation', { 
      title: displayTitle, 
      default: `Are you sure you want to delete "${displayTitle}"? This action cannot be undone.` 
    }))) {
      try {
        await deleteMenuItemMutation.mutateAsync(menuItem.id);
        NotificationService.showSuccess(t('menuItems.delete.success', { title: displayTitle }));
      } catch (error) {
        console.error('Failed to delete menu item:', error);
        NotificationService.showError(t('menuItems.delete.error', { title: displayTitle }));
      }
    }
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setLocationFilter("all");
  };

  const panelTitle = panelMenuItem 
    ? (panelMode === "edit" ? t("menuItems.form.editTitle", { default: "Edit Menu Item" }) : t("menuItems.create.title", { default: "Create Menu Item" }))
    : (panelMode === "edit" ? t("form.editTitle", { default: "Edit Menu" }) : t("form.createTitle", { default: "Create Menu" }));

  const panelSubtitle = panelMenuItem 
    ? (panelMode === "edit" && typeof panelMenuItem === 'object' && panelMenuItem !== null
        ? `${panelMenuItem.title?.en || panelMenuItem.title?.ne || 'Untitled'} • ${selectedMenu?.name?.en || selectedMenu?.name?.ne || 'Untitled Menu'}`
        : `${t("menuItems.create.forMenu", { default: "For menu" })}: ${selectedMenu?.name?.en || selectedMenu?.name?.ne || 'Untitled Menu'}`
      )
    : (panelMode === "edit" ? panelMenu?.name?.en : undefined);

  return (
    <Layer className="navigation-container">
      {/* Enhanced Page Header - Slider Style */}
      <div className="page-header-premium">
        <Breadcrumb noTrailingSlash className="page-header-premium__breadcrumb">
          <BreadcrumbItem href="#">{t("breadcrumbs.home", { default: "Home" })}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t("title", { default: "Navigation" })}</BreadcrumbItem>
        </Breadcrumb>
        
        <div className="page-header-premium__content">
          <div className="page-header-premium__text">
            <h1 className="page-header-premium__title">
              {t("title", { default: "Navigation" })}
            </h1>
            <p className="page-header-premium__description">
              {t("subtitle", { default: "Manage website navigation menus and structure." })}
            </p>
          </div>
          
          <Button 
            size="lg" 
            onClick={handleCreateNew} 
            kind="primary"
            className="page-header-premium__button"
          >
            <Add size={16} style={{ marginRight: '0.5rem' }} />
            {t("actions.createNew", { default: "Create New Menu" })}
          </Button>
        </div>
      </div>

      {/* Enhanced Filters Section - Slider Style */}
      <div className="filters-section-premium">
        <div className="filters-row-premium">
          <div className="filter-group-premium">
            <Dropdown
              id="menu-status-dropdown"
              size="md"
              label={t("filters.status", { default: "Status" })}
              titleText={t("filters.status", { default: "Status" })}
              items={[
                { id: "all", label: t("filters.all", { default: "All" }) },
                { id: "active", label: t("status.active", { default: "Active" }) },
                { id: "inactive", label: t("status.inactive", { default: "Inactive" }) },
              ]}
              selectedItem={{ 
                id: statusFilter, 
                label: statusFilter === "all" 
                  ? t("filters.all", { default: "All" }) 
                  : statusFilter === "active" 
                    ? t("status.active", { default: "Active" }) 
                    : t("status.inactive", { default: "Inactive" })
              }}
              itemToString={(item) => (item ? item.label : "")}
              onChange={({ selectedItem }) => setStatusFilter((selectedItem?.id || "all") as any)}
            />
          </div>

          <div className="filter-group-premium">
            <Dropdown
              id="menu-location-dropdown"
              size="md"
              label={t("filters.location", { default: "Location" })}
              titleText={t("filters.location", { default: "Location" })}
              items={[
                { id: "all", label: t("filters.all", { default: "All" }) },
                { id: "HEADER", label: "Header" },
                { id: "FOOTER", label: "Footer" },
                { id: "SIDEBAR", label: "Sidebar" },
                { id: "MOBILE", label: "Mobile" },
                { id: "CUSTOM", label: "Custom" },
              ]}
              selectedItem={{ 
                id: locationFilter, 
                label: locationFilter === "all" 
                  ? t("filters.all", { default: "All" }) 
                  : locationFilter
              }}
              itemToString={(item) => (item ? item.label : "")}
              onChange={({ selectedItem }) => setLocationFilter((selectedItem?.id || "all") as any)}
            />
          </div>
          
          <div className="filter-actions-premium">
            <Button 
              kind="ghost" 
              size="md" 
              renderIcon={Reset} 
              onClick={handleResetFilters}
              disabled={statusFilter === "all" && locationFilter === "all"}
              className="reset-button-premium"
            >
              {t("filters.reset", { default: "Reset" })}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: "0 1rem 2rem 1rem" }}>
        {currentView === "menus" ? (
          <MenuList 
            onEdit={handleEdit} 
            onManageItems={handleManageMenuItems}
            statusFilter={statusFilter} 
            locationFilter={locationFilter}
          />
        ) : (
          <div>
            {/* Back to menus button */}
            <div style={{ marginBottom: "1rem" }}>
              <Button
                kind="ghost"
                renderIcon={ArrowLeft}
                onClick={handleBackToMenus}
              >
                {t("actions.backToMenus", { default: "Back to Menus" })}
              </Button>
            </div>
            
            {/* Menu item tree */}
            {selectedMenu && (
              <MenuItemTree
                menu={selectedMenu}
                onAddItem={handleCreateMenuItem}
                onEditItem={handleEditMenuItem}
                onDeleteItem={handleDeleteMenuItem}
                onReorder={() => {}} // TODO: Implement reorder
              />
            )}
          </div>
        )}
      </div>

      {/* Right side panel for create/edit */}
      <FeatureFlags enableSidepanelResizer>
      <CreateSidePanel
        title={panelTitle}
        subtitle={panelSubtitle}
        open={panelOpen}
        onRequestClose={() => {
          if (!isSubmitting) {
            closePanel();
          }
        }}
        primaryButtonText={
          isSubmitting
            ? panelMode === 'edit'
              ? t('actions.updating', { default: 'Updating...' })
              : t('actions.creating', { default: 'Creating...' })
            : panelMode === 'edit'
              ? (panelMenuItem ? t('actions.update', { default: 'Update' }) : t('actions.update', { default: 'Update' }))
              : (panelMenuItem ? t('actions.create', { default: 'Create' }) : t('actions.createNew', { default: 'Create' }))
        }
        secondaryButtonText={t('actions.cancel', { default: 'Cancel' })}
        onRequestSubmit={() => {
          if (isSubmitting) return;
          setSubmitting(true);
          
          if (panelMenuItem) {
            // Handle menu item form submission
            const formContainer = document.getElementById('menu-item-form');
            if (formContainer) {
              const form = formContainer.closest('form') as HTMLFormElement;
              if (form) {
                const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
                form.dispatchEvent(submitEvent);
              } else {
                // Fallback to custom event if no form found
                const customSubmitEvent = new CustomEvent('menuItemFormSubmit', { bubbles: true });
                formContainer.dispatchEvent(customSubmitEvent);
              }
            }
          } else {
            // Handle menu form submission
            const formContainer = document.getElementById('menu-form');
            if (formContainer) {
              const form = formContainer.closest('form') as HTMLFormElement;
              if (form) {
                const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
                form.dispatchEvent(submitEvent);
              } else {
                // Fallback to custom event if no form found
                const customSubmitEvent = new CustomEvent('menuFormSubmit', { bubbles: true });
                formContainer.dispatchEvent(customSubmitEvent);
              }
            }
          }
          
          // Reset submitting state after a delay to allow form processing
          setTimeout(() => {
            if (!document.getElementById('menu-form') && !document.getElementById('menu-item-form')) {
              setSubmitting(false);
            }
          }, 100);
        }}
        selectorPageContent="#main-content"
        formTitle={panelMenuItem 
          ? t('sections.menuItemInfo', { default: 'Menu Item Information' })
          : t('sections.basicInfo', { default: 'Basic Information' })
        }
        selectorPrimaryFocus="input, textarea, [tabindex]:not([tabindex='-1'])"
      >
        <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", zIndex: 10 }}>
          <Button
            kind="ghost"
            hasIconOnly
            size="sm"
            iconDescription={t("actions.cancel", { default: "Cancel" })}
            onClick={closePanel}
            renderIcon={Close}
          />
        </div>
        
        <div style={{ padding: 0 }}>
          {panelMenuItem ? (
            <MenuItemFormWrapper
              menu={selectedMenu as any}
              menuItem={panelMenuItem === 'create' ? undefined : panelMenuItem}
              mode={panelMode}
              onSuccess={handleMenuItemFormSuccess}
              onCancel={closePanel}
            />
          ) : (
            <MenuForm 
              mode={panelMode} 
              menu={panelMenu as any} 
              onSuccess={handleFormSuccess} 
              onCancel={closePanel} 
            />
          )}
        </div>
      </CreateSidePanel>
      </FeatureFlags>
    </Layer>
  );
};
