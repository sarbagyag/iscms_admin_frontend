"use client";

import React from "react";
import { Button, Stack } from "@carbon/react";
import { useTranslations } from "next-intl";
import { MenuItemForm } from "./menu-item-form";
import { Menu } from "../types/navigation";

interface MenuItemCreateFormProps {
  menu: Menu;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const MenuItemCreateForm: React.FC<MenuItemCreateFormProps> = ({
  menu,
  parentId,
  onSuccess,
  onCancel,
  className,
}) => {
  const t = useTranslations("navigation");

  return (
    <div className={`menu-item-create-form ${className || ""}`}>
      <div className="form-header">
        <h2>{t("menuItems.create.title", { default: "Create Menu Item" })}</h2>
        <p>
          {parentId 
            ? t("menuItems.create.subtitleWithParent", { default: "Add a new menu item to this section" })
            : t("menuItems.create.subtitle", { default: "Create a new menu item for this menu" })
          }
        </p>
      </div>

      <MenuItemForm
        menu={menu}
        parentId={parentId}
        mode="create"
        onSuccess={onSuccess}
        onCancel={onCancel}
      />

      <div className="form-actions">
        <Stack gap={4} orientation="horizontal">
          <Button
            kind="secondary"
            onClick={onCancel}
          >
            {t("actions.cancel", { default: "Cancel" })}
          </Button>
          <Button
            kind="primary"
            type="submit"
            form="menu-item-form"
          >
            {t("actions.create", { default: "Create Menu Item" })}
          </Button>
        </Stack>
      </div>
    </div>
  );
};
