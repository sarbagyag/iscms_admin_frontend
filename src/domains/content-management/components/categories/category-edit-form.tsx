"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Grid,
  Column,
  NumberInput,
  Toggle,
  InlineLoading,
  FormGroup,
  Dropdown,
  Button,
} from "@carbon/react";
import { Reset } from "@carbon/icons-react";
import { useTranslations } from "next-intl";
import { useContentUIStore } from "../../stores/content-ui-store";
import { useCategories, useUpdateCategory } from "../../hooks/use-category-queries";
import { TranslatableField } from "../shared/translatable-field";
import type { Category } from "../../types/content";

interface CategoryEditFormProps {
  category: Category;
  onSuccess?: () => void;
}

export const CategoryEditForm: React.FC<CategoryEditFormProps> = ({
  category,
  onSuccess,
}) => {
  const t = useTranslations("content-management");
  const tContent = useTranslations("content-management");
  const updateMutation = useUpdateCategory();
  const {
    isSubmitting,
    setSubmitting,
    categoryFormById,
    updateCategoryFormField,
    resetCategoryForm,
  } = useContentUIStore();
  const formData = categoryFormById[category.id] ?? {
    name: category.name,
    description: category.description || { en: "", ne: "" },
    slug: category.slug,
    parentId: category.parentId || "",
    order: category.order,
    isActive: category.isActive,
  };

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const categoriesQuery = useCategories({ page: 1, limit: 100 });
  const parentItems = (categoriesQuery.data?.data ?? [])
    .filter((c) => c.id !== category.id)
    .map((c) => ({ id: c.id, label: c.name.en }));
  const selectedParentItem = useMemo(
    () => parentItems.find((c) => c.id === formData.parentId) || null,
    [parentItems, formData.parentId]
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      submit();
    };
    const container = document.getElementById("content-form");
    const form = container?.closest("form");
    if (form) {
      form.addEventListener("submit", handler);
      return () => form.removeEventListener("submit", handler);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.id, formData]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.en.trim() || !formData.name.ne.trim()) {
      errors.name = t("errors.validation.nameRequired");
    } else if (formData.name.en.trim().length < 3) {
      errors.name = t("errors.validation.nameMinLength");
    }
    if (formData.order < 0) {
      errors.order = t("errors.validation.orderInvalid");
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
      await updateMutation.mutateAsync({
        id: category.id,
        data: {
          name: formData.name,
          description: formData.description,
          slug: formData.slug,
          parentId: formData.parentId || undefined,
          order: formData.order,
          isActive: formData.isActive,
        },
      });
      resetCategoryForm(category.id);
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
      <div id="content-form">
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
            onClick={() => {
              resetCategoryForm(category.id);
              setValidationErrors({});
            }}
            disabled={isSubmitting}
          >
            {tContent("actions.reset", { default: "Reset" })}
          </Button>
        </div>
        {isSubmitting && (
          <div style={{ marginBottom: "1rem" }}>
            <InlineLoading description={t("form.saving")} />
          </div>
        )}

        <Grid fullWidth>
          {/* Basic Information Section */}
          <Column lg={16} md={8} sm={4}>
            <FormGroup legendText={tContent("sections.basicInfo")}>
              <TranslatableField
                label={t("form.name.label")}
                value={formData.name}
                onChange={(v) =>
                  updateCategoryFormField(category.id, "name", v)
                }
                placeholder={{
                  en: t("form.name.placeholder.en"),
                  ne: t("form.name.placeholder.ne"),
                }}
                required
                invalid={!!validationErrors.name}
                invalidText={validationErrors.name}
              />

              <div style={{ marginTop: "1rem" }}>
                <TranslatableField
                  label={t("form.description.label")}
                  value={formData.description}
                  onChange={(v) =>
                    updateCategoryFormField(category.id, "description", v)
                  }
                  placeholder={{
                    en: t("form.description.placeholder.en"),
                    ne: t("form.description.placeholder.ne"),
                  }}
                  multiline
                  rows={3}
                />
              </div>

              <div style={{ marginTop: "1rem" }}>
                <Dropdown
                  id="category-parent"
                  items={parentItems}
                  itemToString={(i) => (i ? i.label : "")}
                  selectedItem={selectedParentItem}
                  onChange={({ selectedItem }) =>
                    updateCategoryFormField(
                      category.id,
                      "parentId",
                      selectedItem?.id || ""
                    )
                  }
                  label={t("form.parent.label")}
                  titleText={t("form.parent.label")}
                />
              </div>

              <div style={{ marginTop: "1rem" }}>
                <NumberInput
                  id="category-order"
                  label={t("form.order.label")}
                  value={formData.order}
                  onChange={(e, { value }) =>
                    value !== undefined &&
                    updateCategoryFormField(category.id, "order", value)
                  }
                  min={1}
                  step={1}
                  invalid={!!validationErrors.order}
                  invalidText={validationErrors.order}
                />
              </div>
            </FormGroup>

            {/* Status Section */}
            <div style={{ marginTop: "2rem" }}>
              <FormGroup legendText={t("form.status.label")}>
                <Toggle
                  id="category-isActive"
                  labelText={t("form.isActive.label")}
                  toggled={formData.isActive}
                  onToggle={(checked) =>
                    updateCategoryFormField(category.id, "isActive", checked)
                  }
                />
              </FormGroup>
            </div>
          </Column>
        </Grid>
      </div>
    </div>
  );
};
