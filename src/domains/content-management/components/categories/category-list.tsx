"use client";

import React, { useCallback, useMemo } from "react";
import {
  InlineLoading,
  Pagination,
  OverflowMenu,
  OverflowMenuItem,
  Tag,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
} from "@carbon/react";
import { Folder } from "@carbon/icons-react";
import { useTranslations } from "next-intl";
import { useCategories, useDeleteCategory } from "../../hooks/use-category-queries";
import { ContentNotificationService } from "../../services/content-notification-service";
import { useContentStore } from "../../stores/content-store";

import type { Category } from "../../types/content";

interface CategoryListProps {
  onCreate?: () => void;
}

export const CategoryList: React.FC<CategoryListProps> = React.memo(({ onCreate }) => {
  const t = useTranslations("content-management");
  const { openEditCategoryPanel } = useContentStore();
  const deleteMutation = useDeleteCategory();
  
  // Use TanStack Query for category data
  const { data: categoryResponse, isLoading, error } = useCategories({ page: 1, limit: 100 });
  
  // Memoize data to prevent unnecessary re-renders
  const categories = useMemo(() => categoryResponse?.data || [], [categoryResponse?.data]);
  
  const pagination = useMemo(() => categoryResponse?.pagination || {
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  }, [categoryResponse?.pagination]);

  // Memoize the edit handler to prevent child re-renders
  const handleEditCategory = useCallback((category: Category) => {
    openEditCategoryPanel(category);
  }, [openEditCategoryPanel]);

  // Memoize the delete handler
  const handleDeleteCategory = useCallback((category: Category) => {
    const categoryName = category.name?.en || category.name?.ne || category.slug || 'Unnamed Category';
    ContentNotificationService.showCategoryDeleteConfirmation(
      categoryName,
      () => {
        deleteMutation.mutate(category.id);
      }
    );
  }, [deleteMutation]);

  // Memoize pagination change handler
  const handlePageChange = useCallback(({ page, pageSize }: { page: number; pageSize: number }) => {
    // Pagination is handled by the store, so we don't need to update local state
    // This is just for logging purposes and can be removed if not needed
  }, []);

  if (isLoading && categories.length === 0) {
    return (
      <div className="loading-container">
        <InlineLoading
          description={t("status.loading", { default: "Loading" })}
        />
      </div>
    );
  }

  return (
    <div className="category-list">
      {categories.length > 0 ? (
        <TableContainer
          title={t("categories.list.title", { default: "Categories" })}
          description={t("categories.subtitle", {
            default: "Manage content categories",
          })}
        >
          <Table size="md" useZebraStyles>
            <TableHead>
              <TableRow>
                <TableHeader>
                  {t("categories.form.name.label", { default: "Name" })}
                </TableHeader>
                <TableHeader>
                  {t("categories.card.parent", { default: "Parent" })}
                </TableHeader>
                <TableHeader>
                  {t("categories.form.order.label", { default: "Order" })}
                </TableHeader>
                <TableHeader>
                  {t("categories.card.active", { default: "Active" })}
                </TableHeader>
                <TableHeader>
                  {t("categories.card.actions", { default: "Actions" })}
                </TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-en">
                    {cat.name.en || cat.name.ne}
                  </TableCell>
                  <TableCell className="font-en">
                    {cat.parent?.name?.en || cat.parent?.name?.ne || ""}
                  </TableCell>
                  <TableCell>{cat.order ?? 0}</TableCell>
                  <TableCell>
                    <Tag type={cat.isActive ? "green" : "gray"} size="sm">
                      {cat.isActive
                        ? t("categories.card.active", { default: "Active" })
                        : t("categories.card.inactive", {
                            default: "Inactive",
                          })}
                    </Tag>
                  </TableCell>
                  <TableCell style={{ textAlign: "right" }}>
                    <OverflowMenu
                      flipped
                      size="sm"
                      aria-label={t("categories.card.actions", {
                        default: "Actions",
                      })}
                    >
                      <OverflowMenuItem
                        itemText={t("categories.card.edit", {
                          default: "Edit",
                        })}
                        onClick={() => handleEditCategory(cat)}
                      />
                      <OverflowMenuItem
                        hasDivider
                        isDelete
                        itemText={t("categories.card.delete", {
                          default: "Delete",
                        })}
                        onClick={() => handleDeleteCategory(cat)}
                      />
                    </OverflowMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* Carbon Design System compliant empty state */
        <div className="empty-state">
          <div className="empty-state-content">
            <div className="empty-state-icon">
              <Folder size={48} />
            </div>
            <h3 className="empty-state-title">
              {t("categories.list.empty", { default: "No categories yet" })}
            </h3>
            <p className="empty-state-description">
              {t("categories.list.emptyDescription", {
                default: "Create your first category to organize content.",
              })}
            </p>
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div className="pagination-container">
          <Pagination
            page={pagination.page}
            pageSize={pagination.limit}
            pageSizes={[12, 24, 48, 96]}
            totalItems={pagination.total}
            onChange={handlePageChange}
            size="md"
          />
        </div>
      )}
    </div>
  );
});

CategoryList.displayName = 'CategoryList';
