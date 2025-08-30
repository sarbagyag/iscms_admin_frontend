"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FormGroup,
  Toggle,
  Grid,
  Column,
  Stack,
  InlineLoading,
  Button,
  Select,
  SelectItem,
  TextInput,
  ComboBox,
} from "@carbon/react";
import { Add, Reset } from "@carbon/icons-react";
import { useTranslations } from "next-intl";
import { TranslatableField } from "./translatable-field";
import { MenuFormData, MenuLocation } from "../types/navigation";
import { useNavigationStore } from "../stores/navigation-store";
import { useCreateMenu } from "../hooks/use-navigation-queries";
import { useCategoriesForNavigation } from "../hooks/use-navigation-queries";

interface MenuCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const MenuCreateForm: React.FC<MenuCreateFormProps> = ({
  onSuccess,
  onCancel,
  className,
}) => {
  const t = useTranslations("navigation");
  const createMutation = useCreateMenu();
  const {
    isSubmitting,
    setSubmitting,
    createFormState,
    updateFormField,
    resetCreateForm,
  } = useNavigationStore();

  // Fetch categories for autocomplete
  const { data: categoriesResponse } = useCategoriesForNavigation();
  const categories = categoriesResponse?.data || [];

  // Debug: Monitor store state changes
  useEffect(() => {
    console.log('🔍 MenuCreateForm - createFormState changed:', createFormState);
    console.log('🔍 MenuCreateForm - categorySlug in store:', createFormState.categorySlug);
  }, [createFormState]);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const validateForm = (): boolean => {
    console.log('🔍 MenuCreateForm - validateForm called');
    const errors: Record<string, string> = {};

    // Validate name (required in both languages)
    if (!createFormState.name.en.trim() && !createFormState.name.ne.trim()) {
      errors.name = t("form.name.validation.required", { default: "Menu name is required in at least one language" });
      console.log('❌ MenuCreateForm - Name validation failed: no name in either language');
    } else {
      console.log('✅ MenuCreateForm - Name validation passed');
    }

    // Validate location
    if (!createFormState.location) {
      errors.location = t("form.location.validation.required", { default: "Menu location is required" });
      console.log('❌ MenuCreateForm - Location validation failed: no location selected');
    } else {
      console.log('✅ MenuCreateForm - Location validation passed:', createFormState.location);
    }

    console.log('🔍 MenuCreateForm - Validation errors:', errors);
    setValidationErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    console.log('🔍 MenuCreateForm - Form validation result:', isValid);
    return isValid;
  };

  const handleFormSubmission = useCallback(async () => {
    try {
      console.log('🚀 MenuCreateForm - handleFormSubmission called');
      console.log('🚀 MenuCreateForm - Current createFormState at submission:', createFormState);
      console.log('🚀 MenuCreateForm - categorySlug at submission:', createFormState.categorySlug);
      
      const payload = {
        name: createFormState.name,
        description: createFormState.description,
        location: createFormState.location,
        isActive: createFormState.isActive,
        isPublished: createFormState.isPublished,
        categorySlug: createFormState.categorySlug || undefined, // Include categorySlug
      };
      
      console.log('🚀 MenuCreateForm - Submitting payload:', payload);
      console.log('🚀 MenuCreateForm - categorySlug value:', createFormState.categorySlug);
      console.log('🚀 MenuCreateForm - Starting mutation...');
      
      const result = await createMutation.mutateAsync(payload);
      console.log('🚀 MenuCreateForm - Mutation successful:', result);

      // Reset form
      resetCreateForm();
      setValidationErrors({});

      // Call success callback immediately
      onSuccess?.();
    } catch (error) {
      console.error("❌ MenuCreateForm - Creation error:", error);
      console.error("❌ MenuCreateForm - Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      // Don't reset submitting state on error so user can see the error
    } finally {
      console.log('🚀 MenuCreateForm - Finally block reached, setting submitting to false');
      setSubmitting(false);
    }
  }, [createFormState, createMutation, resetCreateForm, onSuccess, setSubmitting]);

  // Listen for form submission from the parent CreateSidePanel
  useEffect(() => {
    const handleParentFormSubmit = (e: Event) => {
      console.log('🚀 MenuCreateForm - Parent form submit event triggered');
      e.preventDefault();
      e.stopPropagation();
      setSubmitting(true);
      
      // Validate and submit the form
      if (!validateForm()) {
        console.log('❌ MenuCreateForm - Validation failed');
        setSubmitting(false);
        return;
      }

      console.log('✅ MenuCreateForm - Validation passed, calling handleFormSubmission');
      handleFormSubmission();
    };

    const formContainer = document.getElementById('menu-form');
    const parentForm = formContainer?.closest('form');
    
    console.log('🔍 MenuCreateForm - Setting up form submission listener');
    console.log('🔍 MenuCreateForm - formContainer found:', !!formContainer);
    console.log('🔍 MenuCreateForm - parentForm found:', !!parentForm);
    
    if (parentForm) {
      parentForm.addEventListener('submit', handleParentFormSubmit);
      console.log('✅ MenuCreateForm - Submit event listener added to parent form');
      return () => {
        parentForm.removeEventListener('submit', handleParentFormSubmit);
        console.log('🧹 MenuCreateForm - Submit event listener removed');
      };
    }
    console.log('❌ MenuCreateForm - No parent form found');
    return undefined;
  }, [handleFormSubmission, setSubmitting, validateForm]); // Empty dependency array to prevent re-renders

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSubmitting(true);

    if (!validateForm()) {
      setSubmitting(false);
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: createFormState.name,
        description: createFormState.description,
        location: createFormState.location,
        isActive: createFormState.isActive,
        isPublished: createFormState.isPublished,
        categorySlug: createFormState.categorySlug || undefined, // Include categorySlug
      });

      // Reset form
      resetCreateForm();
      setValidationErrors({});

      // Call success callback immediately
      onSuccess?.();
    } catch (error) {
      console.error("Menu creation error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof MenuFormData, value: unknown) => {
    console.log('🔍 MenuCreateForm - handleInputChange called with field:', field, 'value:', value);
    console.log('🔍 MenuCreateForm - Previous createFormState:', createFormState);
    
    updateFormField('create', field, value);
    
    console.log('🔍 MenuCreateForm - After updateFormField call');
    console.log('🔍 MenuCreateForm - New createFormState should have:', { ...createFormState, [field]: value });

    // Clear validation error for this field
    if (validationErrors[field]) {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  };

  const handleResetForm = () => {
    resetCreateForm();
    setValidationErrors({});
  };

  const locationOptions = [
    { value: 'HEADER', label: 'Header' },
    { value: 'FOOTER', label: 'Footer' },
    { value: 'SIDEBAR', label: 'Sidebar' },
    { value: 'MOBILE', label: 'Mobile' },
    { value: 'CUSTOM', label: 'Custom' },
  ];

  // Prepare category options for autocomplete
  const categoryOptions = categories.map(cat => ({
    id: cat.slug,
    text: cat.name?.en || cat.name?.ne || cat.slug || 'Unknown',
    slug: cat.slug,
  }));

  return (
    <div>
      <div id="menu-form">
        {/* Top action bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
          <Button
            kind="ghost"
            size="sm"
            renderIcon={Reset}
            onClick={handleResetForm}
            disabled={isSubmitting || createMutation.isPending}
          >
            {t("actions.reset", { default: "Reset" })}
          </Button>
          
          {/* Debug: Manual submit button for testing */}
          <Button
            kind="secondary"
            size="sm"
            onClick={() => {
              console.log('🔍 MenuCreateForm - Manual submit button clicked');
              console.log('🔍 MenuCreateForm - Current form state:', createFormState);
              console.log('🔍 MenuCreateForm - categorySlug value:', createFormState.categorySlug);
              const formContainer = document.getElementById('menu-form');
              const parentForm = formContainer?.closest('form');
              if (parentForm) {
                console.log('🔍 MenuCreateForm - Manually dispatching submit event');
                const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
                parentForm.dispatchEvent(submitEvent);
              } else {
                console.log('❌ MenuCreateForm - No parent form found for manual submit');
              }
            }}
            style={{ marginLeft: '0.5rem' }}
          >
            Debug: Manual Submit
          </Button>
          
          {/* Debug: Show current form state */}
          <div style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#666' }}>
            categorySlug: {createFormState.categorySlug || 'empty'} | 
            name.en: "{createFormState.name.en}" | 
            name.ne: "{createFormState.name.ne}" | 
            location: {createFormState.location}
          </div>
        </div>
        
        {isSubmitting && (
          <div style={{ marginBottom: "1rem" }}>
            <InlineLoading description={t("actions.creating", { default: "Creating..." })} />
          </div>
        )}
        
        <Grid fullWidth>
          {/* Basic Information Section */}
          <Column lg={16} md={8} sm={4}>
            {/* Name */}
            <TranslatableField
              label={t("form.name.label", { default: "Menu Name" })}
              value={createFormState.name}
              onChange={(name) => handleInputChange("name", name)}
              placeholder={{
                en: t("form.name.placeholder.en", { default: "Enter menu name in English" }),
                ne: t("form.name.placeholder.ne", { default: "नेपालीमा मेनुको नाम लेख्नुहोस्" }),
              }}
              invalid={!!validationErrors.name}
              invalidText={validationErrors.name}
              required
            />

            {/* Description */}
            <TranslatableField
              label={t("form.description.label", { default: "Description" })}
              value={createFormState.description}
              onChange={(description) => handleInputChange("description", description)}
              placeholder={{
                en: t("form.description.placeholder.en", { default: "Enter menu description in English" }),
                ne: t("form.description.placeholder.ne", { default: "नेपालीमा मेनुको विवरण लेख्नुहोस्" }),
              }}
              type="textarea"
            />

            {/* Location */}
            <div style={{ marginTop: "1rem" }}>
              <Select
                id="location"
                labelText={t("form.location.label", { default: "Menu Location" })}
                value={createFormState.location}
                onChange={(event) => handleInputChange("location", event.target.value)}
                invalid={!!validationErrors.location}
                invalidText={validationErrors.location}
                required
              >
                {locationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} text={option.label} />
                ))}
              </Select>
            </div>

            {/* Category Slug with Autocomplete */}
            <div style={{ marginTop: "1rem" }}>
              <ComboBox
                id="categorySlug"
                titleText={t("form.categorySlug.label", { default: "Category (Optional)" })}
                placeholder={t("form.categorySlug.placeholder", { default: "Type to search categories..." })}
                items={categoryOptions}
                itemToString={(item) => item?.text || ''}
                selectedItem={categoryOptions.find(cat => cat.id === createFormState.categorySlug) || null}
                onChange={({ selectedItem }) => {
                  console.log('🔍 MenuCreateForm - ComboBox onChange called with selectedItem:', selectedItem);
                  const newValue = selectedItem?.id || '';
                  console.log('🔍 MenuCreateForm - Setting categorySlug to:', newValue);
                  handleInputChange("categorySlug", newValue);
                }}
                onInputChange={(inputValue) => {
                  // Filter categories based on input
                  if (!inputValue) {
                    console.log('🔍 MenuCreateForm - Clearing categorySlug');
                    handleInputChange("categorySlug", '');
                  }
                }}
                helperText={t("form.categorySlug.helper", { default: "Link this menu to a specific category for dynamic content" })}
              />
            </div>

            {/* Status Toggles */}
            <div style={{ marginTop: "2rem" }}>
              <Stack gap={4}>
                <Toggle
                  id="isActive"
                  labelText={t("form.isActive.label", { default: "Active" })}
                  toggled={createFormState.isActive}
                  onToggle={(checked) => handleInputChange("isActive", checked)}
                />
                
                <Toggle
                  id="isPublished"
                  labelText={t("form.isPublished.label", { default: "Published" })}
                  toggled={createFormState.isPublished}
                  onToggle={(checked) => handleInputChange("isPublished", checked)}
                />
              </Stack>
            </div>
          </Column>
        </Grid>
      </div>
    </div>
  );
};
