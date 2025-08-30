"use client";

import React from "react";
import { ContentCreateForm } from "./content-create-form";
import { ContentEditForm } from "./content-edit-form";
import { Content } from "../types/content";

interface ContentFormProps {
  content?: Content | null;
  mode: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const ContentForm: React.FC<ContentFormProps> = React.memo(({
  content,
  mode,
  onSuccess,
  onCancel,
  className,
}) => {
  if (mode === "create") {
    return (
      <ContentCreateForm
        onSuccess={onSuccess}
        onCancel={onCancel}
        className={className}
      />
    );
  }

  if (mode === "edit" && content) {
    return (
      <ContentEditForm
        key={content.id}
        content={content}
        onSuccess={onSuccess}
        onCancel={onCancel}
        className={className}
      />
    );
  }

  return null;
});
