"use client";

import React, { useEffect, useState } from 'react';
import { Grid, Column, NumberInput, Toggle, InlineLoading, FormGroup, Dropdown, Button } from '@carbon/react';
import { Reset } from '@carbon/icons-react';
import { useTranslations } from 'next-intl';
import { useHRUIStore } from '../../stores/hr-ui-store';
import { useCreateEmployeeWithPhoto, useDepartments } from '../../hooks/use-hr-queries';
import { TranslatableField } from '../shared/translatable-field';
import { ContactInfoForm } from '../shared/contact-info-form';
import { EmployeePhotoUpload } from './employee-photo-upload';

interface EmployeeCreateFormProps {
  onSuccess?: () => void;
}

export const EmployeeCreateForm: React.FC<EmployeeCreateFormProps> = ({ onSuccess }) => {
  const t = useTranslations('hr-employees');
  const tHr = useTranslations('hr');
  const createMutation = useCreateEmployeeWithPhoto();
  const { 
    isSubmitting, 
    setSubmitting, 
    createEmployeeForm, 
    updateEmployeeFormField, 
    resetEmployeeForm,
    createSelectedFile,
    setSelectedFile,
    resetFormState
  } = useHRUIStore();

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const departmentsQuery = useDepartments({ page: 1, limit: 100 });
  const departmentItems = (departmentsQuery.data?.data ?? []).map((d) => ({ id: d.id, label: d.departmentName.en }));
  const selectedDepartmentItem = departmentItems.find((d) => d.id === createEmployeeForm.departmentId) || null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!createEmployeeForm.name.en.trim() || !createEmployeeForm.name.ne.trim()) {
      errors.name = t('errors.validation.nameRequired');
    }
    if (!createEmployeeForm.position.en.trim() || !createEmployeeForm.position.ne.trim()) {
      errors.position = t('errors.validation.positionRequired');
    }
    if (!createEmployeeForm.departmentId) {
      errors.departmentId = t('errors.validation.departmentRequired');
    }
    if (createEmployeeForm.order < 0) {
      errors.order = t('errors.validation.orderInvalid');
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      submit();
    };
    const container = document.getElementById('hr-form');
    const form = container?.closest('form');
    if (form) {
      form.addEventListener('submit', handler);
      return () => form.removeEventListener('submit', handler);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createEmployeeForm]);

  const submit = async () => {
    setSubmitting(true);
    if (!validate()) {
      setSubmitting(false);
      return;
    }

    try {
      if (createSelectedFile) {
        // Debug logging
        console.log('Creating employee with photo:', { createSelectedFile, createEmployeeForm });
        
        // Create with photo
        await createMutation.mutateAsync({
          file: createSelectedFile,
          data: {
            name: createEmployeeForm.name,
            departmentId: createEmployeeForm.departmentId,
            position: createEmployeeForm.position,
            order: createEmployeeForm.order,
            mobileNumber: createEmployeeForm.mobileNumber || undefined,
            telephone: createEmployeeForm.telephone || undefined,
            email: createEmployeeForm.email || undefined,
            roomNumber: createEmployeeForm.roomNumber || undefined,
            isActive: createEmployeeForm.isActive,
          },
        });
      } else {
        // Create without photo (fallback to regular create)
        const { useCreateEmployee } = await import('../../hooks/use-hr-queries');
        const createEmployeeMutation = useCreateEmployee();
        await createEmployeeMutation.mutateAsync({
          name: createEmployeeForm.name,
          departmentId: createEmployeeForm.departmentId,
          position: createEmployeeForm.position,
          order: createEmployeeForm.order,
          mobileNumber: createEmployeeForm.mobileNumber || undefined,
          telephone: createEmployeeForm.telephone || undefined,
          email: createEmployeeForm.email || undefined,
          roomNumber: createEmployeeForm.roomNumber || undefined,
          isActive: createEmployeeForm.isActive,
        });
      }

      resetEmployeeForm('create');
      resetFormState('create');
      setValidationErrors({});
      onSuccess?.();
    } catch (err) {
      // handled by mutations/notifications layer
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = (file: File) => {
    console.log('Photo upload handler called with file:', file);
    setSelectedFile('create', file);
  };

  const handlePhotoRemove = () => {
    setSelectedFile('create', null);
  };

  const getCurrentImageUrl = (): string | undefined => {
    if (createSelectedFile) {
      return URL.createObjectURL(createSelectedFile);
    }
    return undefined;
  };

  return (
    <div>
      <div id="hr-form">
        {/* Top action bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
          <Button
            kind="ghost"
            size="sm"
            renderIcon={Reset}
            onClick={() => {
              resetEmployeeForm('create');
              resetFormState('create');
              setValidationErrors({});
            }}
            disabled={isSubmitting}
          >
            {tHr('actions.reset', { default: 'Reset' })}
          </Button>
        </div>
        {isSubmitting && (
          <div style={{ marginBottom: '1rem' }}>
            <InlineLoading description={t('form.saving')} />
          </div>
        )}

        <Grid fullWidth>
          {/* Basic Information Section */}
          <Column lg={16} md={8} sm={4}>
            <FormGroup legendText={tHr('sections.basicInfo')}>
              <TranslatableField
                label={t('form.name.label')}
                value={createEmployeeForm.name}
                onChange={(v) => updateEmployeeFormField('create', 'name', v)}
                placeholder={{ en: t('form.name.placeholder.en'), ne: t('form.name.placeholder.ne') }}
                required
                invalid={!!validationErrors.name}
                invalidText={validationErrors.name}
              />

              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <TranslatableField
                  label={t('form.position.label')}
                  value={createEmployeeForm.position}
                  onChange={(v) => updateEmployeeFormField('create', 'position', v)}
                  placeholder={{ en: t('form.position.placeholder'), ne: t('form.position.placeholder') }}
                  required
                  invalid={!!validationErrors.position}
                  invalidText={validationErrors.position}
                />
                  <Dropdown
                    id="employee-department"
                    items={departmentItems}
                    itemToString={(i) => (i ? i.label : '')}
                    selectedItem={selectedDepartmentItem}
                    onChange={({ selectedItem }) => updateEmployeeFormField('create', 'departmentId', selectedItem?.id || '')}
                    invalid={!!validationErrors.departmentId}
                    invalidText={validationErrors.departmentId}
                    label={t('form.department.label')}
                    titleText={t('form.department.label')}
                  />

                  <NumberInput
                    id="employee-order"
                    label={t('form.order.label')}
                    value={createEmployeeForm.order}
                    onChange={(e, { value }) => value !== undefined && updateEmployeeFormField('create', 'order', value)}
                    min={1}
                    step={1}
                    invalid={!!validationErrors.order}
                    invalidText={validationErrors.order}
                  />
                  </div>
            </FormGroup>

            {/* Photo Section */}
            <div style={{ marginTop: '1.5rem' }}>
              <FormGroup legendText={t('form.photo.label')}>
                <EmployeePhotoUpload
                  currentImage={getCurrentImageUrl()}
                  onUpload={handlePhotoUpload}
                  onRemove={handlePhotoRemove}
                  isUploading={createMutation.isPending}
                  showPreview={true}
                  showHeader={false}
                  allowRemove={true}
                />
              </FormGroup>
            </div>

            {/* Contact Information Section */}
            <div style={{ marginTop: '1.5rem' }}>
              <FormGroup legendText={t('form.contactInfo.label')}>
                <ContactInfoForm
                  contactInfo={{
                    mobileNumber: createEmployeeForm.mobileNumber,
                    telephone: createEmployeeForm.telephone,
                    email: createEmployeeForm.email,
                    roomNumber: createEmployeeForm.roomNumber,
                  }}
                  onChange={(c) => {
                    updateEmployeeFormField('create', 'mobileNumber', c.mobileNumber || '');
                    updateEmployeeFormField('create', 'telephone', c.telephone || '');
                    updateEmployeeFormField('create', 'email', c.email || '');
                    updateEmployeeFormField('create', 'roomNumber', c.roomNumber || '');
                  }}
                />
              </FormGroup>
            </div>

            {/* Status Section */}
            <div style={{ marginTop: '2.5rem' }}>
              <FormGroup legendText={t('form.status.label')}>
                <Toggle
                  id="employee-isActive"
                  labelText={t('form.isActive.label')}
                  toggled={createEmployeeForm.isActive}
                  onToggle={(checked) => updateEmployeeFormField('create', 'isActive', checked)}
                />
              </FormGroup>
            </div>
          </Column>
        </Grid>
      </div>
    </div>
  );
};


