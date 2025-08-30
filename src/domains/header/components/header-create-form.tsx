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
  Select,
  SelectItem,
  TextInput,
} from "@carbon/react";
import { Add, Reset, View } from "@carbon/icons-react";
import { useTranslations } from "next-intl";
import { TranslatableField } from "./translatable-field";
import { LogoUpload } from "./logo-upload";
import { HeaderFormData, HeaderAlignment } from "../types/header";
import { useHeaderStore } from "../stores/header-store";
import { useCreateHeaderWithLogos } from "../hooks/use-header-queries";

interface HeaderCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const HeaderCreateForm: React.FC<HeaderCreateFormProps> = ({
  onSuccess,
  onCancel,
  className,
}) => {
  const t = useTranslations("headers");
  const createMutation = useCreateHeaderWithLogos();
  const {
    formData,
    isSubmitting,
    setSubmitting,
    leftLogoFile,
    rightLogoFile,
    setLogoFile,
    resetForm,
    validateForm,
    validationErrors,
    updateFormField,
  } = useHeaderStore();

  // Listen for form submission from the parent CreateSidePanel
  useEffect(() => {
    const handleFormSubmission = async () => {
      try {
        console.log('🚀 HeaderCreateForm: Starting header creation...');
        // Create the header with logo data
        const submitData = { ...formData };

        console.log('📤 HeaderCreateForm: Submitting data:', {
          headerData: submitData,
          leftLogoFile: leftLogoFile ? 'File present' : 'No file',
          rightLogoFile: rightLogoFile ? 'File present' : 'No file'
        });

        // Create the header with logos using the new hook
        const result = await createMutation.mutateAsync({
          headerData: submitData,
          leftLogoFile: leftLogoFile || undefined,
          rightLogoFile: rightLogoFile || undefined,
        });

        console.log('✅ HeaderCreateForm: Header created successfully:', result);
        resetForm();
        onSuccess?.();
      } catch (error) {
        console.error('❌ HeaderCreateForm: Header creation error:', error);
      } finally {
        console.log('🏁 HeaderCreateForm: Form submission completed, setting submitting to false');
        setSubmitting(false);
      }
    };

    const formContainer = document.getElementById('header-form');
    
    console.log('🔍 HeaderCreateForm: Setting up form submission listener');
    
    // Listen for custom formSubmit event
    const handleCustomSubmit = (e: CustomEvent) => {
      console.log('🔍 HeaderCreateForm: Custom formSubmit event received');
      e.preventDefault();
      e.stopPropagation();
      setSubmitting(true);
      
      // Validate and submit the form
      if (!validateForm()) {
        console.log('❌ HeaderCreateForm: Form validation failed');
        setSubmitting(false);
        return;
      }

      // Additional validation for logo files - only validate if logos are configured
      if (formData.logo.leftLogo && !leftLogoFile) {
        console.log('❌ HeaderCreateForm: Left logo file missing');
        useHeaderStore.getState().setValidationErrors({ 
          logo: 'Left logo file is required when logo is configured' 
        });
        setSubmitting(false);
        return;
      }
      if (formData.logo.rightLogo && !rightLogoFile) {
        console.log('❌ HeaderCreateForm: Right logo file missing');
        useHeaderStore.getState().setValidationErrors({ 
          logo: 'Right logo file is required when logo is configured' 
        });
        setSubmitting(false);
        return;
      }

      console.log('✅ HeaderCreateForm: Validation passed, proceeding with submission');
      handleFormSubmission();
    };
    
    formContainer?.addEventListener('formSubmit', handleCustomSubmit as EventListener);
    return () => {
      formContainer?.removeEventListener('formSubmit', handleCustomSubmit as EventListener);
    };
  }, [formData, createMutation, onSuccess, resetForm, setSubmitting, validateForm, leftLogoFile, rightLogoFile]);

  const handleInputChange = (field: keyof HeaderFormData, value: unknown) => {
    updateFormField(field, value);
  };

  const handleTypographyChange = (
    field: keyof HeaderFormData["typography"],
    value: any
  ) => {
    updateFormField("typography", {
      ...formData.typography,
      [field]: value,
    });
  };

  const handleLayoutChange = (
    field: keyof HeaderFormData["layout"],
    value: any
  ) => {
    updateFormField("layout", {
      ...formData.layout,
      [field]: value,
    });
  };

  const handlePaddingChange = (
    field: keyof HeaderFormData["layout"]["padding"],
    value: number
  ) => {
    updateFormField("layout", {
      ...formData.layout,
      padding: {
        ...formData.layout.padding,
        [field]: value,
      },
    });
  };

  const handleMarginChange = (
    field: keyof HeaderFormData["layout"]["margin"],
    value: number
  ) => {
    updateFormField("layout", {
      ...formData.layout,
      margin: {
        ...formData.layout.margin,
        [field]: value,
      },
    });
  };

  const handleLogoChange = (
    field: keyof HeaderFormData["logo"],
    value: any
  ) => {
    updateFormField("logo", {
      ...formData.logo,
      [field]: value,
    });
  };

  const handleLogoUpload = (
    type: "left" | "right",
    file: File,
    logoData: any
  ) => {
    // Store the file for later upload
    setLogoFile(type, file);

    // Create a logo object with only the reference data (no file data)
    const logoObject = {
      mediaId: undefined,
      altText: logoData.altText || { en: "", ne: "" },
      width: logoData.width || 150,
      height: logoData.height || 50,
    };

    // Update the form state with the new logo
    if (type === "left") {
      handleLogoChange("leftLogo", logoObject);
    } else {
      handleLogoChange("rightLogo", logoObject);
    }
  };

  const handleLogoRemove = (type: "left" | "right") => {
    if (type === "left") {
      handleLogoChange("leftLogo", undefined);
      setLogoFile("left", null);
    } else {
      handleLogoChange("rightLogo", undefined);
      setLogoFile("right", null);
    }
  };

  const handleResetForm = () => {
    resetForm();
  };

  return (
    <div id="header-form">
      {/* Top action bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "0.5rem",
        }}
      >
        <Button
          kind="ghost"
          size="sm"
          renderIcon={Reset}
          onClick={handleResetForm}
          disabled={isSubmitting || createMutation.isPending}
          type="button"
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
        <Column lg={16} md={8} sm={4}>
          {/* Name */}
          <TranslatableField
            label={t("form.basic.name")}
            value={formData.name}
            onChange={(name) => handleInputChange("name", name)}
            placeholder={{
              en: t("form.basic.namePlaceholder.en"),
              ne: t("form.basic.namePlaceholder.ne")
            }}
            invalid={!!validationErrors.name}
            invalidText={validationErrors.name}
          />

          <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
            <Column lg={8} md={4} sm={4}>
              <NumberInput
                id="order"
                label={t("form.basic.order") || "Display Order"}
                value={formData.order}
                onChange={(event, { value }) => {
                  if (value !== undefined && typeof value === "number") {
                    handleInputChange("order", value);
                  }
                }}
                min={1}
                step={1}
                invalid={!!validationErrors.order}
                invalidText={validationErrors.order}
              />
            </Column>

            <Column lg={8} md={4} sm={4}>
              <Select
                id="alignment"
                labelText={t("form.basic.alignment") || "Text Alignment"}
                value={formData.alignment}
                onChange={(event) =>
                  handleInputChange("alignment", event.target.value)
                }
              >
                <SelectItem
                  value={HeaderAlignment.LEFT}
                  text={t("form.basic.alignmentLeft") || "Left"}
                />
                <SelectItem
                  value={HeaderAlignment.CENTER}
                  text={t("form.basic.alignmentCenter") || "Center"}
                />
                <SelectItem
                  value={HeaderAlignment.RIGHT}
                  text={t("form.basic.alignmentRight") || "Right"}
                />
                <SelectItem
                  value={HeaderAlignment.JUSTIFY}
                  text={t("form.basic.alignmentJustify") || "Justify"}
                />
              </Select>
            </Column>
          </div>

          {/* Logo Section */}
          <div style={{ marginTop: "1rem" }}>
            <FormGroup legendText={t("form.logo.title") || "Logo Configuration"}>
              {validationErrors.logo && (
                <div style={{ marginBottom: "1rem", color: "var(--cds-text-error)", fontSize: "0.75rem" }}>
                  {validationErrors.logo}
                </div>
              )}

              {/* Logo Alignment */}
              <Select
                id="logoAlignment"
                labelText={t("form.logo.alignment") || "Logo Alignment"}
                value={formData.logo.logoAlignment}
                onChange={(event) =>
                  handleLogoChange("logoAlignment", event.target.value)
                }
                style={{ marginBottom: "1rem" }}
              >
                <SelectItem value="left" text="Left" />
                <SelectItem value="center" text="Center" />
                <SelectItem value="right" text="Right" />
              </Select>

              {/* Left Logo */}
              <div style={{ marginBottom: "1rem" }}>
                <h4 style={{ marginBottom: "0.5rem" }}>Left Logo</h4>
                <LogoUpload
                  type="left"
                  currentLogo={formData.logo.leftLogo}
                  onUpload={(file, logoData) =>
                    handleLogoUpload("left", file, logoData)
                  }
                  onRemove={() => handleLogoRemove("left")}
                  isUploading={false}
                  disabled={isSubmitting}
                  showPreview={true}
                />
              </div>

              {/* Right Logo */}
              <div>
                <h4 style={{ marginBottom: "0.5rem" }}>Right Logo</h4>
                <LogoUpload
                  type="right"
                  currentLogo={formData.logo.rightLogo}
                  onUpload={(file, logoData) =>
                    handleLogoUpload("right", file, logoData)
                  }
                  onRemove={() => handleLogoRemove("right")}
                  isUploading={false}
                  disabled={isSubmitting}
                  showPreview={true}
                />
              </div>
            </FormGroup>
          </div>
        </Column>

        <div style={{ marginTop: "2rem" }}>
          <Toggle
            id="isActive"
            labelText={t("form.basic.isActive") || "Active"}
            toggled={formData.isActive}
            onToggle={(checked) => handleInputChange("isActive", checked)}
          />

          <div style={{ marginTop: "1rem" }}>
            <Toggle
              id="isPublished"
              labelText={
                t("form.basic.isPublished") || "Published (Live on website)"
              }
              toggled={formData.isPublished}
              onToggle={(checked) =>
                handleInputChange("isPublished", checked)
              }
              disabled={!formData.isActive}
            />
          </div>
        </div>
      </Grid>
    </div>
  );
};
