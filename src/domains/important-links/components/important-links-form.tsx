"use client";

import React from "react";
import { ImportantLinksCreateForm } from "./important-links-create-form";
import { ImportantLinksEditForm } from "./important-links-edit-form";
import { ImportantLink } from "../types/important-links";

interface ImportantLinksFormProps {
  link?: ImportantLink;
  mode: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const ImportantLinksForm: React.FC<ImportantLinksFormProps> = ({
  link,
  mode,
  onSuccess,
  onCancel,
  className,
}) => {
  if (mode === "create") {
    return (
      <ImportantLinksCreateForm
        onSuccess={onSuccess}
        onCancel={onCancel}
        className={className}
      />
    );
  }

  if (mode === "edit" && link) {
    return (
      <ImportantLinksEditForm
        key={link.id}
        link={link}
        onSuccess={onSuccess}
        onCancel={onCancel}
        className={className}
      />
    );
  }

  return null;
};
