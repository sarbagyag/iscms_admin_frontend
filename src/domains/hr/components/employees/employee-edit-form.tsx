"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Grid, Column, NumberInput, Toggle, InlineLoading, FormGroup, Dropdown, Button } from '@carbon/react';
import { Reset } from '@carbon/icons-react';
import { useTranslations } from 'next-intl';
import { useHRUIStore } from '../../stores/hr-ui-store';
import { useDepartments, useUpdateEmployee, useUploadEmployeePhoto, useRemoveEmployeePhoto } from '../../hooks/use-hr-queries';
import { TranslatableField } from '../shared/translatable-field';
import { ContactInfoForm } from '../shared/contact-info-form';
import { EmployeePhotoUpload } from './employee-photo-upload';
import type { EmployeeResponseDto } from '../../types/employee';

interface EmployeeEditFormProps {
  employee: EmployeeResponseDto;
  onSuccess?: () => void;
}

export const EmployeeEditForm: React.FC<EmployeeEditFormProps> = ({ employee, onSuccess }) => {
  const t = useTranslations('hr-employees');
  // Use shared HR namespace for common labels like sections and actions
  const tHr = useTranslations('hr');
  const updateMutation = useUpdateEmployee();
  const uploadPhotoMutation = useUploadEmployeePhoto();
  const removePhotoMutation = useRemoveEmployeePhoto();
  const { 
    isSubmitting, 
    setSubmitting, 
    employeeFormById, 
    updateEmployeeFormField, 
    resetEmployeeForm,
    selectedFileById,
    setSelectedFile,
    resetFormState
  } = useHRUIStore();
  
  const formData = employeeFormById[employee.id] ?? {
    name: employee.name,
    departmentId: employee.departmentId,
    position: employee.position,
    order: employee.order,
    mobileNumber: employee.mobileNumber || '',
    telephone: employee.telephone || '',
    email: employee.email || '',
    roomNumber: employee.roomNumber || '',
    isActive: employee.isActive,
    photoMediaId: employee.photoMediaId || '',
  };

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const departmentsQuery = useDepartments({ page: 1, limit: 100 });
  const departmentItems = (departmentsQuery.data?.data ?? []).map((d) => ({ id: d.id, label: d.departmentName.en }));
  const selectedDepartmentItem = useMemo(() => departmentItems.find((d) => d.id === formData.departmentId) || null, [departmentItems, formData.departmentId]);

  const selectedFile = selectedFileById[employee.id] ?? null;

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
  }, [employee.id, formData]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.en.trim() || !formData.name.ne.trim()) {
      errors.name = t('errors.validation.nameRequired');
    }
    if (!formData.position.en.trim() || !formData.position.ne.trim()) {
      errors.position = t('errors.validation.positionRequired');
    }
    if (!formData.departmentId) {
      errors.departmentId = t('errors.validation.departmentRequired');
    }
    if (formData.order < 0) {
      errors.order = t('errors.validation.orderInvalid');
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async () => {
    setSubmitting(true);
    if (!validate()) {
      setSubmitting(false);
      return;
    }
    try {
      // Debug logging
      console.log('Updating employee:', { employeeId: employee.id, formData, selectedFile });
      
      // Update employee data
      await updateMutation.mutateAsync({
        id: employee.id,
        data: {
          name: formData.name,
          departmentId: formData.departmentId,
          position: formData.position,
          order: formData.order,
          mobileNumber: formData.mobileNumber || undefined,
          telephone: formData.telephone || undefined,
          email: formData.email || undefined,
          roomNumber: formData.roomNumber || undefined,
          isActive: formData.isActive,
        },
      });

      // Handle photo upload if there's a new file
      if (selectedFile) {
        console.log('Uploading photo for employee:', { employeeId: employee.id, selectedFile });
        await uploadPhotoMutation.mutateAsync({ id: employee.id, file: selectedFile });
      }

      resetEmployeeForm(employee.id);
      resetFormState(employee.id);
      setValidationErrors({});
      onSuccess?.();
    } catch (err) {
      // handled upstream
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = (file: File) => {
    console.log('Photo upload handler called with file:', file);
    setSelectedFile(employee.id, file);
  };

  const handlePhotoRemove = async () => {
    if (selectedFile) {
      // Remove the newly selected file
      setSelectedFile(employee.id, null);
    } else if (employee.photoMediaId) {
      // Remove the existing photo from the server
      try {
        await removePhotoMutation.mutateAsync(employee.id);
      } catch (error) {
        console.error("Photo removal failed:", error);
      }
    }
  };

  const getCurrentImageUrl = (): string | undefined => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }
    if (employee.photo?.presignedUrl) {
      return employee.photo.presignedUrl;
    }
    if (employee.photo?.url) {
      return employee.photo.url;
    }
    return undefined;
  };

  return (
    <div>
      <div id="hr-form">
        {/* Top action bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
          <Button
            kind={"ghost"}
            size="sm"
            renderIcon={Reset}
            onClick={() => {
              resetEmployeeForm(employee.id);
              resetFormState(employee.id);
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
                value={formData.name}
                onChange={(v) => updateEmployeeFormField(employee.id, 'name', v)}
                placeholder={{ en: t('form.name.placeholder.en'), ne: t('form.name.placeholder.ne') }}
                required
                invalid={!!validationErrors.name}
                invalidText={validationErrors.name}
              />

              <div style={{ marginTop: '1rem' }}>
                <TranslatableField
                  label={t('form.position.label')}
                  value={formData.position}
                  onChange={(v) => updateEmployeeFormField(employee.id, 'position', v)}
                  placeholder={{ en: t('form.position.placeholder'), ne: t('form.position.placeholder') }}
                  required
                  invalid={!!validationErrors.position}
                  invalidText={validationErrors.position}
                />
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <Column lg={8} md={4} sm={4}>
                  <Dropdown
                    id="employee-department"
                    items={departmentItems}
                    itemToString={(i) => (i ? i.label : '')}
                    selectedItem={selectedDepartmentItem}
                    onChange={({ selectedItem }) => updateEmployeeFormField(employee.id, 'departmentId', selectedItem?.id || '')}
                    invalid={!!validationErrors.departmentId}
                    invalidText={validationErrors.departmentId}
                    label={t('form.department.label')}
                    titleText={t('form.department.label')}
                  />
                </Column>

                <Column lg={8} md={4} sm={4}>
                  <NumberInput
                    id="employee-order"
                    label={t('form.order.label')}
                    value={formData.order}
                    onChange={(e, { value }) => value !== undefined && updateEmployeeFormField(employee.id, 'order', value)}
                    min={1}
                    step={1}
                    invalid={!!validationErrors.order}
                    invalidText={validationErrors.order}
                  />
                </Column>
              </div>
            </FormGroup>

            {/* Photo Section */}
            <div style={{ marginTop: '1.5rem' }}>
              <FormGroup legendText={t('form.photo.label')}>
                <EmployeePhotoUpload
                  currentImage={getCurrentImageUrl()}
                  onUpload={handlePhotoUpload}
                  onRemove={handlePhotoRemove}
                  isUploading={uploadPhotoMutation.isPending || removePhotoMutation.isPending}
                  showPreview={true}
                  showHeader={false}
                  allowRemove={true}
                />
              </FormGroup>
            </div>

            {/* Contact Information Section */}
            <div style={{ marginTop: '2.5rem' }}>
              <FormGroup legendText={t('form.contactInfo.label')}>
                <ContactInfoForm
                  contactInfo={{
                    mobileNumber: formData.mobileNumber,
                    telephone: formData.telephone,
                    email: formData.email,
                    roomNumber: formData.roomNumber,
                  }}
                  onChange={(c) => {
                    updateEmployeeFormField(employee.id, 'mobileNumber', c.mobileNumber || '');
                    updateEmployeeFormField(employee.id, 'telephone', c.telephone || '');
                    updateEmployeeFormField(employee.id, 'email', c.email || '');
                    updateEmployeeFormField(employee.id, 'roomNumber', c.roomNumber || '');
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
                  toggled={formData.isActive}
                  onToggle={(checked) => updateEmployeeFormField(employee.id, 'isActive', checked)}
                />
              </FormGroup>
            </div>
          </Column>
        </Grid>
      </div>
    </div>
  );
};


