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
import { Save, Reset, View } from "@carbon/icons-react";
import { useTranslations } from "next-intl";
import { TranslatableField } from "./translatable-field";
import { LogoUpload } from "./logo-upload";
import { HeaderFormData, HeaderAlignment, HeaderConfig } from "../types/header";
import { useHeaderStore } from "../stores/header-store";
import { useUpdateHeader } from "../hooks/use-header-queries";
import {
  LogoUploadService,
  LogoUploadData,
} from "../services/logo-upload-service";
import { LogoItem } from "../types/header";

interface HeaderEditFormProps {
  header: HeaderConfig;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const HeaderEditForm: React.FC<HeaderEditFormProps> = ({
  header,
  onSuccess,
  onCancel,
  className,
}) => {
  const t = useTranslations("headers");
  const updateMutation = useUpdateHeader();
  
  console.log('🔍 HeaderEditForm: Component rendered', { 
    headerId: header.id, 
    updateMutation: !!updateMutation,
    isPending: updateMutation?.isPending,
    isError: updateMutation?.isError 
  });

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

  // Initialize form data with existing header data
  useEffect(() => {
    console.log('🔍 HeaderEditForm: Initializing form data with header:', header);
    
    // Update form fields with existing header data
    updateFormField("name", header.name || { en: "", ne: "" });
    updateFormField("order", header.order || 1);
    updateFormField("alignment", header.alignment || "left");
    updateFormField("isActive", header.isActive ?? true);
    updateFormField("isPublished", header.isPublished ?? false);
    
    // Update typography
    if (header.typography) {
      updateFormField("typography", {
        fontFamily: header.typography.fontFamily || "Arial",
        fontSize: header.typography.fontSize || 16,
        fontWeight: header.typography.fontWeight || "normal",
        color: header.typography.color || "#000000",
        lineHeight: header.typography.lineHeight || 1.2,
        letterSpacing: header.typography.letterSpacing || 0,
      });
    }
    
    // Update layout
    if (header.layout) {
      updateFormField("layout", {
        headerHeight: header.layout.headerHeight || 80,
        backgroundColor: header.layout.backgroundColor || "#ffffff",
        borderColor: header.layout.borderColor || "",
        borderWidth: header.layout.borderWidth || 0,
        padding: header.layout.padding || { top: 0, right: 0, bottom: 0, left: 0 },
        margin: header.layout.margin || { top: 0, right: 0, bottom: 0, left: 0 },
      });
    }
    
    // Update logo configuration - FIXED: Properly load existing logo data
    if (header.logo) {
      const logoConfig = {
        logoAlignment: header.logo.logoAlignment || "left",
        logoSpacing: header.logo.logoSpacing || 10,
        leftLogo: header.logo.leftLogo ? {
          mediaId: header.logo.leftLogo.mediaId,
          altText: header.logo.leftLogo.altText || { en: "", ne: "" },
          width: header.logo.leftLogo.width || 150,
          height: header.logo.leftLogo.height || 50,
        } : undefined,
        rightLogo: header.logo.rightLogo ? {
          mediaId: header.logo.rightLogo.mediaId,
          altText: header.logo.rightLogo.altText || { en: "", ne: "" },
          width: header.logo.rightLogo.width || 150,
          height: header.logo.rightLogo.height || 50,
        } : undefined,
      };
      
      console.log('🔍 HeaderEditForm: Setting logo config:', logoConfig);
      updateFormField("logo", logoConfig);
    }
    
    console.log('✅ HeaderEditForm: Form data initialized');
  }, [header, updateFormField]);

  // State for tracking logo upload progress
  const [logoUploadProgress, setLogoUploadProgress] = useState<{
    left: boolean;
    right: boolean;
  }>({ left: false, right: false });

  // Listen for form submission from the parent CreateSidePanel
  useEffect(() => {
    const handleFormSubmit = async () => {
      console.log('🔍 HeaderEditForm: handleFormSubmit called');
      try {
        // Validate the form
        console.log('🔍 HeaderEditForm: Validating form...');
        if (!validateForm()) {
          console.log('❌ HeaderEditForm: Form validation failed');
          setSubmitting(false);
          return;
        }
        console.log('✅ HeaderEditForm: Form validation passed');

        // Prepare the form data for submission (without logo files)
        const submitData = { ...formData };

        // Remove logo data for header update - we'll handle logos separately
        submitData.logo.leftLogo = undefined;
        submitData.logo.rightLogo = undefined;

        console.log('🚀 HeaderEditForm: Starting header update...', { id: header.id, data: submitData });

        // Update the header first
        const result = await updateMutation.mutateAsync({ id: header.id, data: submitData });

        console.log('✅ HeaderEditForm: Header updated successfully', result);

        // Now handle logo updates if files are present
        if (leftLogoFile || rightLogoFile) {
          // Handle left logo
          if (leftLogoFile && formData.logo.leftLogo) {
            setLogoUploadProgress((prev) => ({ ...prev, left: true }));
            try {
              const leftLogoData: LogoUploadData = {
                logo: leftLogoFile,
                altText: formData.logo.leftLogo.altText,
                width: formData.logo.leftLogo.width,
                height: formData.logo.leftLogo.height,
              };

              // Use the correct upload endpoint for files
              await LogoUploadService.uploadLogoFile(
                header.id,
                "left",
                leftLogoFile,
                leftLogoData
              );
              console.log('✅ HeaderEditForm: Left logo uploaded successfully');
            } catch (error) {
              console.error("Left logo upload error:", error);
            } finally {
              setLogoUploadProgress((prev) => ({ ...prev, left: false }));
            }
          }

          // Handle right logo
          if (rightLogoFile && formData.logo.rightLogo) {
            setLogoUploadProgress((prev) => ({ ...prev, right: true }));
            try {
              const rightLogoData: LogoUploadData = {
                logo: rightLogoFile,
                altText: formData.logo.rightLogo.altText,
                width: formData.logo.rightLogo.width,
                height: formData.logo.rightLogo.height,
              };

              // Use the correct upload endpoint for files
              await LogoUploadService.uploadLogoFile(
                header.id,
                "right",
                rightLogoFile,
                rightLogoData
              );
              console.log('✅ HeaderEditForm: Right logo uploaded successfully');
            } catch (error) {
              console.error("Right logo upload error:", error);
            } finally {
              setLogoUploadProgress((prev) => ({ ...prev, right: false }));
            }
          }
        }

        onSuccess?.();
      } catch (error) {
        console.error('❌ HeaderEditForm: Header update error:', error);
      } finally {
        console.log('🏁 HeaderEditForm: Form submission completed, setting submitting to false');
        setSubmitting(false);
      }
    };

    const formContainer = document.getElementById("header-form");
    
    console.log('🔍 HeaderEditForm: Setting up form submission listener');
    
    // Listen for custom formSubmit event
    const handleCustomSubmit = (e: CustomEvent) => {
      console.log('🔍 HeaderEditForm: Custom formSubmit event received');
      e.preventDefault();
      e.stopPropagation();
      if (isSubmitting) return;
      setSubmitting(true);
      handleFormSubmit();
    };
    
    formContainer?.addEventListener('formSubmit', handleCustomSubmit as EventListener);
    return () => {
      formContainer?.removeEventListener('formSubmit', handleCustomSubmit as EventListener);
    };
  }, [
    formData,
    updateMutation,
    onSuccess,
    setSubmitting,
    validateForm,
    isSubmitting,
    leftLogoFile,
    rightLogoFile,
    header.id,
  ]);

  const handleInputChange = (field: keyof HeaderFormData, value: unknown) => {
    updateFormField(field, value);
  };

  const handleTypographyChange = (
    field: keyof HeaderFormData["typography"],
    value: unknown
  ) => {
    updateFormField("typography", {
      ...formData.typography,
      [field]: value,
    });
  };

  const handleLayoutChange = (
    field: keyof HeaderFormData["layout"],
    value: unknown
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
    value: unknown
  ) => {
    updateFormField("logo", {
      ...formData.logo,
      [field]: value,
    });
  };

  const handleLogoUpload = (
    type: "left" | "right",
    file: File,
    logoData: Partial<LogoItem>
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

  const handleLogoRemove = async (type: "left" | "right") => {
    try {
      // Remove from backend if it's an existing logo
      if (header.logo?.[type === "left" ? "leftLogo" : "rightLogo"]?.mediaId) {
        await LogoUploadService.removeLogo(header.id, type);
      }

      // Update local state
      if (type === "left") {
        handleLogoChange("leftLogo", undefined);
        setLogoFile("left", null);
      } else {
        handleLogoChange("rightLogo", undefined);
        setLogoFile("right", null);
      }
    } catch (error) {
      console.error(`Error removing ${type} logo:`, error);
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
          disabled={isSubmitting || updateMutation.isPending}
        >
          {t("actions.reset")}
        </Button>
      </div>

      {isSubmitting && (
        <div style={{ marginBottom: "1rem" }}>
          <InlineLoading description={t("actions.updating")} />
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
                  isUploading={logoUploadProgress.left}
                  disabled={isSubmitting}
                  showPreview={true}
                  headerId={header.id}
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
                  isUploading={logoUploadProgress.right}
                  disabled={isSubmitting}
                  showPreview={true}
                  headerId={header.id}
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
