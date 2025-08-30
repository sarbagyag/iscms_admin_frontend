"use client";

import React from "react";
import { Button, Stack } from "@carbon/react";
import { useTranslations } from "next-intl";
import { MenuItemForm } from "./menu-item-form";
import { MenuItem, Menu } from "../types/navigation";

interface MenuItemEditFormProps {
  menu: Menu;
  menuItem: MenuItem;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const MenuItemEditForm: React.FC<MenuItemEditFormProps> = ({
  menu,
  menuItem,
  onSuccess,
  onCancel,
  className,
}) => {
  const t = useTranslations("navigation");

  return (
    <div className={`menu-item-edit-form ${className || ""}`}>
      <div className="form-header">
        <h2>{t("menuItems.edit.title", { default: "Edit Menu Item" })}</h2>
        <p>
          {t("menuItems.edit.subtitle", { 
            default: "Update the menu item details and settings" 
          })}
        </p>
      </div>

      <MenuItemForm
        menu={menu}
        menuItem={menuItem}
        mode="edit"
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
            {t("actions.update", { default: "Update Menu Item" })}
          </Button>
        </Stack>
      </div>
    </div>
  );
};
