"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Grid, Column, NumberInput, Toggle, InlineLoading, FormGroup, Dropdown, Button } from '@carbon/react';
import { Reset } from '@carbon/icons-react';
import { useTranslations } from 'next-intl';
import { useHRUIStore } from '../../stores/hr-ui-store';
import { useCreateDepartment, useDepartments } from '../../hooks/use-hr-queries';
import { TranslatableField } from '../shared/translatable-field';

interface DepartmentCreateFormProps {
  onSuccess?: () => void;
}

export const DepartmentCreateForm: React.FC<DepartmentCreateFormProps> = ({ onSuccess }) => {
  const t = useTranslations('hr-departments');
  const tHr = useTranslations('hr');
  const createMutation = useCreateDepartment();
  const { isSubmitting, setSubmitting, createDepartmentForm, updateDepartmentFormField, resetDepartmentForm } = useHRUIStore();

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const departmentsQuery = useDepartments({ page: 1, limit: 100 });
  const parentItems = (departmentsQuery.data?.data ?? []).map((d) => ({ id: d.id, label: d.departmentName.en }));
  const selectedParentItem = parentItems.find((d) => d.id === createDepartmentForm.parentId) || null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!createDepartmentForm.departmentName.en.trim() || !createDepartmentForm.departmentName.ne.trim()) {
      errors.departmentName = t('errors.validation.nameRequired');
    } else if (createDepartmentForm.departmentName.en.trim().length < 3) {
      errors.departmentName = t('errors.validation.nameMinLength');
    }
    if (createDepartmentForm.order < 0) {
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
  }, [createDepartmentForm]);

  const submit = async () => {
    setSubmitting(true);
    if (!validate()) {
      setSubmitting(false);
      return;
    }
    try {
      await createMutation.mutateAsync({
        departmentName: createDepartmentForm.departmentName,
        parentId: createDepartmentForm.parentId || undefined,
        departmentHeadId: createDepartmentForm.departmentHeadId || undefined,
        order: createDepartmentForm.order,
        isActive: createDepartmentForm.isActive,
      });
      resetDepartmentForm('create');
      setValidationErrors({});
      onSuccess?.();
    } catch (err) {
      // handled upstream
    } finally {
      setSubmitting(false);
    }
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
              resetDepartmentForm('create');
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
                value={createDepartmentForm.departmentName}
                onChange={(v) => updateDepartmentFormField('create', 'departmentName', v)}
                placeholder={{ en: t('form.name.placeholder.en'), ne: t('form.name.placeholder.ne') }}
                required
                invalid={!!validationErrors.departmentName}
                invalidText={validationErrors.departmentName}
              />

              <div style={{ marginTop: '1rem' }}>
                <Dropdown
                  id="department-parent"
                  items={parentItems}
                  itemToString={(i) => (i ? i.label : '')}
                  selectedItem={selectedParentItem}
                  onChange={({ selectedItem }) => updateDepartmentFormField('create', 'parentId', selectedItem?.id || '')}
                  label={t('form.parent.label')}
                  titleText={t('form.parent.label')}
                />
              </div>

              <div style={{ marginTop: '1rem' }}>
                <NumberInput
                  id="department-order"
                  label={t('form.order.label')}
                  value={createDepartmentForm.order}
                  onChange={(e, { value }) => value !== undefined && updateDepartmentFormField('create', 'order', value)}
                  min={1}
                  step={1}
                  invalid={!!validationErrors.order}
                  invalidText={validationErrors.order}
                />
              </div>
            </FormGroup>

            {/* Status Section */}
            <div style={{ marginTop: '2rem' }}>
              <FormGroup legendText={t('form.status.label')}>
                <Toggle
                  id="department-isActive"
                  labelText={t('form.isActive.label')}
                  toggled={createDepartmentForm.isActive}
                  onToggle={(checked) => updateDepartmentFormField('create', 'isActive', checked)}
                />
              </FormGroup>
            </div>
          </Column>
        </Grid>
      </div>
    </div>
  );
};


