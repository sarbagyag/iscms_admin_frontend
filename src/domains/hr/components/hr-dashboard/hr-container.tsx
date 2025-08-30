"use client";

import React, { useMemo, useState } from 'react';
import { Layer, Button, Breadcrumb, BreadcrumbItem } from '@carbon/react';
import { Add } from '@carbon/icons-react';
import { useTranslations } from 'next-intl';
import { CreateSidePanel, unstable_FeatureFlags as FeatureFlags } from '@carbon/ibm-products';
import '@/lib/ibm-products/config';
import { useHRUIStore } from '../../stores/hr-ui-store';
import { useDepartments, useEmployees } from '../../hooks/use-hr-queries';
import { HRPanelForms } from './hr-panel-forms';
import '../../styles/hr.css';
import { EmployeeList } from '../employees/employee-list';
import { DepartmentList } from '../departments/department-list';
import { Close } from '@carbon/icons-react';

export const HRContainer: React.FC = () => {
  const t = useTranslations('hr');
  const { panelOpen, panelMode, activeEntity, openCreateDepartment, openCreateEmployee, closePanel, isSubmitting, setSubmitting, selectedTabIndex, setSelectedTabIndex } = useHRUIStore();
  const [employeeFilters, setEmployeeFilters] = useState<{ isActive?: boolean; departmentId?: string }>({});
  const [departmentFilters, setDepartmentFilters] = useState<{ isActive?: boolean }>({});

  const employeesQuery = useEmployees({ page: 1, limit: 12, ...employeeFilters });
  const departmentsQuery = useDepartments({ page: 1, limit: 12, ...departmentFilters });

  const tHr = useTranslations('hr');
  const tEmp = useTranslations('hr-employees');
  const tDept = useTranslations('hr-departments');
  
  const panelTitle = useMemo(() => {
    if (activeEntity === 'department') return panelMode === 'edit' ? tDept('form.editTitle') : tDept('form.createTitle');
    if (activeEntity === 'employee') return panelMode === 'edit' ? tEmp('form.editTitle') : tEmp('form.createTitle');
    return '';
  }, [activeEntity, panelMode, tEmp, tDept]);
  
  const primaryText = useMemo(() => {
    if (activeEntity === 'department') return isSubmitting ? tDept('form.saving') : tDept('form.save');
    if (activeEntity === 'employee') return isSubmitting ? tEmp('form.saving') : tEmp('form.save');
    return '';
  }, [activeEntity, isSubmitting, tEmp, tDept]);
  
  const secondaryText = useMemo(() => {
    if (activeEntity === 'department') return tDept('form.cancel');
    if (activeEntity === 'employee') return tEmp('form.cancel');
    return '';
  }, [activeEntity, tEmp, tDept]);

  const handleCreateNew = () => {
    if (selectedTabIndex === 0) {
      openCreateEmployee();
    } else {
      openCreateDepartment();
    }
  };

  return (
    <Layer className="hr-container">
      {/* Page Header */}
      <div style={{ padding: "2rem 1rem 1rem 1rem" }}>
        <Breadcrumb noTrailingSlash style={{ marginBottom: "1.5rem" }}>
          <BreadcrumbItem href="#">{t('breadcrumbs.home', { default: "Home" })}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{tHr('title')}</BreadcrumbItem>
        </Breadcrumb>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "2rem", fontWeight: "400", margin: "0 0 0.5rem 0", textAlign: "left" }}>
              {tHr('title')}
            </h1>
            <p style={{ margin: "0", color: "var(--cds-text-secondary, #525252)", textAlign: "left" }}>
              {tHr('subtitle')}
            </p>
          </div>
          
          <Button size="lg" renderIcon={Add} onClick={handleCreateNew} kind="primary">
            {selectedTabIndex === 0 ? tEmp('list.createNew') : tDept('list.createNew')}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ padding: "0 1rem 1rem 1rem" }}>
        <div className="hr-main-tabs">
          <button
            type="button"
            className={`hr-tab-button ${selectedTabIndex === 0 ? 'active' : ''}`}
            onClick={() => setSelectedTabIndex(0)}
          >
            {tEmp('list.title')}
          </button>
          <button
            type="button"
            className={`hr-tab-button ${selectedTabIndex === 1 ? 'active' : ''}`}
            onClick={() => setSelectedTabIndex(1)}
          >
            {tDept('list.title')}
          </button>
        </div>

        {/* Tab Content */}
        <div className="hr-tab-content">
          {selectedTabIndex === 0 && (
            <div style={{ padding: '0 0 1rem 0' }}>
              <EmployeeList />
            </div>
          )}
          {selectedTabIndex === 1 && (
            <div style={{ padding: '0 0 1rem 0' }}>
              <DepartmentList />
            </div>
          )}
        </div>
      </div>

      {/* Right side panel for create/edit */}
      <FeatureFlags enableSidepanelResizer>
        <CreateSidePanel
          title={panelTitle}
          subtitle={panelMode === "edit" ? 
            (activeEntity === 'employee' ? 
              (useHRUIStore.getState().panelEmployee?.name?.en) : 
              (useHRUIStore.getState().panelDepartment?.departmentName?.en)
            ) : undefined
          }
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
            const formContainer = document.getElementById('hr-form');
            
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
          
          <div id="hr-form">
            <HRPanelForms onSuccess={closePanel} />
          </div>
        </CreateSidePanel>
      </FeatureFlags>
    </Layer>
  );
};


