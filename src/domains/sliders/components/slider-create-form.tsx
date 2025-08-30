"use client";

import React, { useState, useEffect } from "react";
import {
  FormGroup,
  NumberInput,
  Toggle,
  Grid,
  Column,
  Stack,
  InlineLoading,
  Button,
} from "@carbon/react";
import { Add, Reset } from "@carbon/icons-react";
import { useTranslations } from "next-intl";
import { TranslatableField } from "./translatable-field";
import { SliderImageUpload } from "./slider-image-upload";
import { SliderFormData } from "../types/slider";
import { useSliderStore } from "../stores/slider-store";
import { useCreateSliderWithImage } from "../hooks/use-slider-queries";

interface SliderCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const SliderCreateForm: React.FC<SliderCreateFormProps> = ({
  onSuccess,
  onCancel,
  className,
}) => {
  const t = useTranslations("sliders");
  const createMutation = useCreateSliderWithImage();
  const {
    isSubmitting,
    setSubmitting,
    createFormState,
    updateFormField,
    createSelectedFile,
    setSelectedFile,
    resetCreateForm,
  } = useSliderStore();

  // Form state is managed in store (persisted). Keep only validation locally.

  // Validation state
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const selectedFile = createSelectedFile;

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate image file
    if (!selectedFile) {
      errors.image = t("form.image.validation.required");
    }

    // Validate position
    if (createFormState.position < 1) {
      errors.position = t("form.position.validation.minimum");
    }

    // Validate display time
    if (createFormState.displayTime < 1000) {
      errors.displayTime = t("form.displayTime.validation.minimum");
    }

    // Optional: Validate title if provided
    if (createFormState.title.en.trim() && createFormState.title.en.trim().length < 2) {
      errors.title = t("form.title.validation.tooShort");
    }
    if (createFormState.title.ne.trim() && createFormState.title.ne.trim().length < 2) {
      errors.title = t("form.title.validation.tooShort");
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Listen for form submission from the parent CreateSidePanel
  useEffect(() => {
    const handleParentFormSubmit = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      setSubmitting(true);
      
      // Validate and submit the form
      if (!validateForm()) {
        setSubmitting(false);
        return;
      }

      if (!selectedFile) {
        setValidationErrors({ image: t("form.image.validation.required") });
        setSubmitting(false);
        return;
      }

      handleFormSubmission();
    };

    const handleFormSubmission = async () => {
      try {
        await createMutation.mutateAsync({ file: selectedFile!, data: createFormState });

        // Reset form
        resetCreateForm();
        setValidationErrors({});

        // Call success callback immediately
        onSuccess?.();
      } catch (error) {
        console.error("Slider creation error:", error);
      } finally {
        setSubmitting(false);
      }
    };

    const formContainer = document.getElementById('slider-form');
    const parentForm = formContainer?.closest('form');
    
    if (parentForm) {
      parentForm.addEventListener('submit', handleParentFormSubmit);
      return () => {
        parentForm.removeEventListener('submit', handleParentFormSubmit);
      };
    }
    return undefined;
  }, [selectedFile, createFormState, createMutation, onSuccess, t, resetCreateForm, setSubmitting]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSubmitting(true);

    if (!validateForm()) {
      setSubmitting(false);
      return;
    }

    if (!selectedFile) {
      setValidationErrors({ image: t("form.image.validation.required") });
      setSubmitting(false);
      return;
    }

    try {
      await createMutation.mutateAsync({ file: selectedFile!, data: createFormState });

      // Reset form
      resetCreateForm();
      setValidationErrors({});

      // Call success callback immediately
      onSuccess?.();
    } catch (error) {
      console.error("Slider creation error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = (file: File) => {
    setSelectedFile('create', file);
    // Clear image validation error when file is selected
    if (validationErrors.image) {
      const newErrors = { ...validationErrors };
      delete newErrors.image;
      setValidationErrors(newErrors);
    }
  };

  const handleImageRemove = () => {
    setSelectedFile('create', null);
  };

  const handleInputChange = (field: keyof SliderFormData, value: unknown) => {
    updateFormField('create', field, value);

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

  return (
    <div>
      <div id="slider-form">
        {/* Top action bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
          <Button
            kind="ghost"
            size="sm"
            renderIcon={Reset}
            onClick={handleResetForm}
            disabled={isSubmitting || createMutation.isPending}
          >
            {t("actions.reset")}
          </Button>
        </div>
        {isSubmitting && (
          <div style={{ marginBottom: "1rem" }}>
            <InlineLoading description={t("actions.creating")} />
          </div>
        )}
        <Grid fullWidth>
          {/* Basic Information Section */}
          <Column lg={16} md={8} sm={4} >
            {/* Title */}
            <TranslatableField
              label={t("form.title.label")}
              value={createFormState.title}
              onChange={(title) => handleInputChange("title", title)}
              placeholder={{
                en: t("form.title.placeholder.en"),
                ne: t("form.title.placeholder.ne"),
              }}
              invalid={!!validationErrors.title}
              invalidText={validationErrors.title}
            />

            <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
              
                <Column lg={8} md={4} sm={4} >
                  <NumberInput
                    id="position"
                    label={t("form.position.label")}
                    value={createFormState.position}
                    onChange={(event, { value }) => {
                      if (value !== undefined) {
                        handleInputChange("position", value);
                      }
                    }}
                    min={1}
                    step={1}
                    invalid={!!validationErrors.position}
                    invalidText={validationErrors.position}
                  />
                </Column>

                <Column lg={8} md={4} sm={4}>
                  <NumberInput
                    id="displayTime"
                    label={t("form.displayTime.label")}
                    value={createFormState.displayTime}
                    onChange={(event, { value }) => {
                      if (value !== undefined) {
                        handleInputChange("displayTime", value);
                      }
                    }}
                    min={1000}
                    step={500}
                    invalid={!!validationErrors.displayTime}
                    invalidText={validationErrors.displayTime}
                  />
                </Column>
            </div>
          

            {/* Image Section */}
            <div style={{ marginTop: "1rem" }}>
              <FormGroup legendText={t("sections.image")}>
                {validationErrors.image && (
                  <div style={{ marginBottom: "1rem", color: "var(--cds-text-error)", fontSize: "0.75rem" }}>
                    {validationErrors.image}
                  </div>
                )}

                <SliderImageUpload
                   currentImage={
                    selectedFile ? URL.createObjectURL(selectedFile) : undefined
                  }
                  onUpload={handleImageUpload}
                  onRemove={handleImageRemove}
                  isUploading={createMutation.isPending}
                  showPreview={!!selectedFile}
                  showHeader={false}
                />
              </FormGroup>
            </div>
          </Column>

          <div style={{ marginTop: "2rem" }}>
              <Toggle
                id="isActive"
                labelText={t("form.isActive.label")}
                toggled={createFormState.isActive}
                onToggle={(checked) => handleInputChange("isActive", checked)}
              />
            </div>
        </Grid>
      </div>
    </div>
  );
};
