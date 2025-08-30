"use client";

import React, { useCallback, useState, useEffect } from "react";
import {
  Button,
  Tile,
  Stack,
  InlineLoading,
  TextInput,
  NumberInput,
} from "@carbon/react";
import { TrashCan, Image } from "@carbon/icons-react";
import { useTranslations } from "next-intl";
import { TranslatableField } from "./translatable-field";
import { LogoItem } from "../types/header";
import { useHeaderWithLogoMedia } from "../hooks/use-header-queries";

interface LogoUploadProps {
  type: "left" | "right";
  currentLogo?: LogoItem;
  onUpload: (file: File, logoData: Partial<LogoItem>) => void;
  onRemove: () => void;
  isUploading?: boolean;
  disabled?: boolean;
  showPreview?: boolean;
  headerId?: string; // Add headerId to fetch logo media
}

interface ValidationError {
  message: string;
}

// Logo file validation
const validateLogoFile = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "image/gif",
  ];
  const maxSize = 5 * 1024 * 1024; // 5MB for logos

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "JPEG, PNG, WebP, SVG, or GIF only.",
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File size exceeds 5MB limit.",
    };
  }

  return { isValid: true };
};

export const LogoUpload: React.FC<LogoUploadProps> = ({
  type,
  currentLogo,
  onUpload,
  onRemove,
  isUploading = false,
  disabled = false,
  showPreview = true,
  headerId,
}) => {
  const t = useTranslations("headers");
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] =
    useState<ValidationError | null>(null);
  const [logoData, setLogoData] = useState<Partial<LogoItem>>({
    altText: { en: "", ne: "" },
    width: 150,
    height: 50,
  });

  // Initialize logo data with existing logo if available
  useEffect(() => {
    if (currentLogo) {
      console.log('🔍 LogoUpload: Initializing with existing logo:', currentLogo);
      setLogoData({
        altText: currentLogo.altText || { en: "", ne: "" },
        width: currentLogo.width || 150,
        height: currentLogo.height || 50,
      });
    } else {
      // Reset to defaults if no logo
      setLogoData({
        altText: { en: "", ne: "" },
        width: 150,
        height: 50,
      });
    }
  }, [currentLogo]);

  // Fetch header with logo media if headerId is provided
  const { data: headerWithMedia } = useHeaderWithLogoMedia(
    headerId || "",
    !!headerId
  );

  // Extract logo media from header response
  const logoMedia =
    headerId && headerWithMedia?.logo
      ? type === "left"
        ? headerWithMedia.logo.leftLogo?.media
        : headerWithMedia.logo.rightLogo?.media
      : undefined;

  // Check if logo data is valid for upload
  const isLogoDataValid = () => {
    return logoData.altText?.en?.trim() || logoData.altText?.ne?.trim();
  };

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Validate the file before uploading
        const validation = validateLogoFile(file);
        if (!validation.isValid) {
          setValidationError({ message: validation.error || "Invalid" });
          return;
        }

        // Check if logo data is valid
        if (!isLogoDataValid()) {
          setValidationError({
            message: "Please fill in alt text before uploading logo",
          });
          return;
        }

        setValidationError(null);

        // Create the logo object with the correct structure (mediaId will be set by backend)
        const logoObject = {
          altText: logoData.altText || { en: "", ne: "" },
          width: logoData.width || 150,
          height: logoData.height || 50,
        };

        console.log("LogoUpload - uploading with data:", logoObject);
        onUpload(file, logoObject);
      }
    },
    [onUpload, logoData, isLogoDataValid]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);

      const files = event.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file) {
          // Validate the file before uploading
          const validation = validateLogoFile(file);
          if (!validation.isValid) {
            setValidationError({ message: validation.error || "Invalid" });
            return;
          }

          // Check if logo data is valid
          if (!isLogoDataValid()) {
            setValidationError({
              message: "Please fill in alt text before uploading logo",
            });
            return;
          }

          setValidationError(null);

          // Create the logo object with the correct structure (mediaId will be set by backend)
          const logoObject = {
            altText: logoData.altText || { en: "", ne: "" },
            width: logoData.width || 150,
            height: logoData.height || 50,
          };

          console.log("LogoUpload - dropping with data:", logoObject);
          onUpload(file, logoObject);
        }
      }
    },
    [onUpload, logoData, isLogoDataValid]
  );

  const handleLogoDataChange = (field: keyof LogoItem, value: unknown) => {
    console.log("LogoUpload - data change:", field, value);
    setLogoData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="logo-upload">
      <h4>
        {type === "left"
          ? t("form.logo.leftLogo") || "Left Logo"
          : t("form.logo.rightLogo") || "Right Logo"}
      </h4>

      {/* Logo Configuration */}
      <Stack gap={4} style={{ marginBottom: "1rem" }}>
        <TranslatableField
          label={t("form.logo.altText") || "Alt Text"}
          value={logoData.altText || { en: "", ne: "" }}
          onChange={(value) => handleLogoDataChange("altText", value)}
          placeholder={{
            en:
              t("form.logo.altTextPlaceholder.en") ||
              "Logo description in English",
            ne:
              t("form.logo.altTextPlaceholder.ne") ||
              "Logo description in Nepali",
          }}
          required
        />

        <div style={{ display: "flex", gap: "1rem" }}>
          <NumberInput
            id={`${type}LogoWidth`}
            label={t("form.logo.width") || "Width"}
            value={logoData.width || 150}
            onChange={(event, { value }) => {
              if (value !== undefined && typeof value === "number") {
                handleLogoDataChange("width", value);
              }
            }}
            min={10}
            max={500}
            step={1}
          />

          <NumberInput
            id={`${type}LogoHeight`}
            label={t("form.logo.height") || "Height"}
            value={logoData.height || 50}
            onChange={(event, { value }) => {
              if (value !== undefined && typeof value === "number") {
                handleLogoDataChange("height", value);
              }
            }}
            min={10}
            max={500}
            step={1}
          />
        </div>
      </Stack>

      {/* Instructions */}
      <div
        style={{
          marginBottom: "1rem",
          padding: "0.75rem",
          backgroundColor: "var(--cds-ui-02)",
          border: "1px solid var(--cds-ui-03)",
          borderRadius: "0",
          fontSize: "0.875rem",
        }}
      >
        <strong>Step 1:</strong> Fill in the alt text and dimensions above
        <br />
        <strong>Step 2:</strong> Upload your logo file below
      </div>

      {/* Validation Error Display */}
      {validationError && (
        <div className="validation-error">
          <p className="error-message">{validationError.message}</p>
        </div>
      )}

      {currentLogo && showPreview ? (
        <Stack gap={4}>
          <div
            style={{
              width: "100%",
              height: "120px",
              backgroundColor: "var(--cds-ui-02)",
              border: "1px solid var(--cds-ui-03)",
              borderRadius: "0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {logoMedia?.presignedUrl || logoMedia?.url ? (
              <img
                src={logoMedia.presignedUrl || logoMedia.url}
                alt={
                  currentLogo.altText?.en || currentLogo.altText?.ne || "Logo"
                }
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <Image size={32} />
            )}
          </div>
          <Button
            kind="danger"
            renderIcon={TrashCan}
            onClick={onRemove}
            disabled={disabled || isUploading}
            size="sm"
          >
            {t("image.preview.remove") || "Remove Logo"}
          </Button>
        </Stack>
      ) : (
        <Tile
          className={`upload-area ${dragOver ? "drag-over" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Stack gap={4} className="upload-content">
            {isUploading ? (
              <div className="upload-loading">
                <InlineLoading
                  description={t("image.upload.uploading") || "Uploading..."}
                />
              </div>
            ) : !isLogoDataValid() ? (
              <>
                <Image size={32} className="upload-icon" />
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    color: "var(--cds-text-02)",
                  }}
                >
                  Please fill in alt text and dimensions above first
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.75rem",
                    color: "var(--cds-text-03)",
                  }}
                >
                  Then you can upload your logo file
                </p>
              </>
            ) : (
              <>
                <Image size={32} className="upload-icon" />
                <p style={{ margin: 0, fontSize: "0.875rem" }}>
                  {t("image.upload.placeholder") ||
                    "Drop logo file here or click to browse"}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.75rem",
                    color: "var(--cds-text-02)",
                  }}
                >
                  JPEG, PNG, WebP, SVG, GIF up to 5MB
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml"
                  onChange={handleFileUpload}
                  disabled={disabled || isUploading}
                  className="file-input"
                  id={`${type}-logo-input`}
                />
                <Button
                  kind="secondary"
                  disabled={disabled || isUploading}
                  type="button"
                  size="sm"
                  onClick={() =>
                    document.getElementById(`${type}-logo-input`)?.click()
                  }
                >
                  {t("image.upload.button") || "Browse Files"}
                </Button>
              </>
            )}
          </Stack>
        </Tile>
      )}

      {/* Upload Status with Spinner - only show when there's no current logo */}
      {isUploading && !currentLogo && (
        <div className="upload-status">
          <Stack gap={2} className="upload-status-content">
            <InlineLoading
              description={t("image.upload.uploading") || "Uploading..."}
            />
          </Stack>
        </div>
      )}
    </div>
  );
};
