import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Menu, MenuItem, MenuFormData, MenuItemFormData } from '../types/navigation';

export interface NavigationUIStore {
  // UI state for IBM Products SidePanel
  panelOpen: boolean;
  panelMode: 'create' | 'edit';
  panelMenu: Menu | null;
  panelMenuItem: MenuItem | 'create' | null;
  isEditing: boolean;
  isSubmitting: boolean;

  // Form state management
  activeFormId: string | 'create' | null;
  activeMenuItemFormId: string | 'create' | null;
  
  // Persisted form fields (exclude any File objects)
  formStateById: Record<string, MenuFormData>;
  createFormState: MenuFormData;
  
  // Menu item form state
  menuItemFormStateById: Record<string, MenuItemFormData>;
  createMenuItemFormState: MenuItemFormData;

  // UI Actions
  openCreatePanel: () => void;
  openEditPanel: (menu: Menu) => void;
  openCreateMenuItemPanel: (menuId: string) => void;
  openEditMenuItemPanel: (menuItem: MenuItem) => void;
  closePanel: () => void;
  setEditing: (isEditing: boolean) => void;
  setSubmitting: (isSubmitting: boolean) => void;

  // Form Actions
  initializeEditForm: (menu: Menu) => void;
  initializeEditMenuItemForm: (menuItem: MenuItem) => void;
  resetCreateForm: () => void;
  resetCreateMenuItemForm: () => void;
  updateFormField: (
    id: string | 'create',
    field: keyof MenuFormData,
    value: unknown
  ) => void;
  updateMenuItemFormField: (
    id: string | 'create',
    field: keyof MenuItemFormData,
    value: unknown
  ) => void;
  resetFormState: (id: string | 'create') => void;
  resetMenuItemFormState: (id: string | 'create') => void;
}

export const useNavigationStore = create<NavigationUIStore>()(
  persist(
    (set, get) => ({
      // Initial UI state
      panelOpen: false,
      panelMode: 'create',
      panelMenu: null,
      panelMenuItem: null,
      isEditing: false,
      isSubmitting: false,

      // Form state
      activeFormId: null,
      activeMenuItemFormId: null,
      formStateById: {},
      createFormState: {
        name: { en: '', ne: '' },
        description: { en: '', ne: '' },
        location: 'HEADER' as any,
        isActive: true,
        isPublished: false,
        categorySlug: '', // New field for linking menu to category
      },
      menuItemFormStateById: {},
      createMenuItemFormState: {
        title: { en: '', ne: '' },
        description: { en: '', ne: '' },
        url: '',
        target: 'self',
        icon: '',
        order: 1,
        isActive: true,
        isVisible: true,
        isPublished: false,
        itemType: 'LINK' as any,
        itemId: '',
        categorySlug: '', // New field for linking menu item to category
        contentSlug: '', // New field for linking menu item to content
      },

      // UI Actions
      openCreatePanel: () => {
        set({
          panelOpen: true,
          panelMode: 'create',
          panelMenu: null,
          panelMenuItem: null,
          isEditing: false,
          isSubmitting: false,
          activeFormId: 'create',
        });
      },

      openEditPanel: (menu: Menu) => {
        const initial: MenuFormData = {
          name: menu.name ?? { en: '', ne: '' },
          description: menu.description ?? { en: '', ne: '' },
          location: menu.location,
          isActive: menu.isActive,
          isPublished: menu.isPublished,
          categorySlug: menu.categorySlug || '', // New field for linking menu to category
        };
        set((state) => ({
          panelOpen: true,
          panelMode: 'edit',
          panelMenu: menu,
          panelMenuItem: null,
          isEditing: true,
          isSubmitting: false,
          activeFormId: menu.id,
          formStateById: { ...state.formStateById, [menu.id]: initial },
        }));
      },

      openCreateMenuItemPanel: (menuId: string) => {
        set({
          panelOpen: true,
          panelMode: 'create',
          panelMenu: null,
          panelMenuItem: 'create' as any, // Use 'create' to indicate creating a new menu item
          isEditing: false,
          isSubmitting: false,
          activeMenuItemFormId: 'create',
        });
      },

      openEditMenuItemPanel: (menuItem: MenuItem) => {
        const initial: MenuItemFormData = {
          title: menuItem.title ?? { en: '', ne: '' },
          description: menuItem.description ?? { en: '', ne: '' },
          url: menuItem.url || '',
          target: menuItem.target,
          icon: menuItem.icon || '',
          order: menuItem.order,
          isActive: menuItem.isActive,
          isVisible: menuItem.isVisible ?? true,
          isPublished: menuItem.isPublished,
          itemType: menuItem.itemType,
          itemId: menuItem.itemId || '',
          categorySlug: menuItem.categorySlug || '', // New field for linking menu item to category
          contentSlug: menuItem.contentSlug || '', // New field for linking menu item to content
        };
        set((state) => ({
          panelOpen: true,
          panelMode: 'edit',
          panelMenu: null,
          panelMenuItem: menuItem,
          isEditing: true,
          isSubmitting: false,
          activeMenuItemFormId: menuItem.id,
          menuItemFormStateById: { ...state.menuItemFormStateById, [menuItem.id]: initial },
        }));
      },

      closePanel: () => {
        set({ 
          panelOpen: false, 
          isEditing: false, 
          isSubmitting: false,
          panelMenu: null,
          panelMenuItem: null,
        });
      },

      setEditing: (isEditing: boolean) => {
        set({ isEditing });
      },

      setSubmitting: (isSubmitting: boolean) => {
        set({ isSubmitting });
      },

      // Form Actions
      initializeEditForm: (menu: Menu) => {
        const initial: MenuFormData = {
          name: menu.name ?? { en: '', ne: '' },
          description: menu.description ?? { en: '', ne: '' },
          location: menu.location,
          isActive: menu.isActive,
          isPublished: menu.isPublished,
          categorySlug: menu.categorySlug || '', // New field for linking menu to category
        };
        set((state) => ({
          formStateById: { ...state.formStateById, [menu.id]: initial },
          activeFormId: menu.id,
        }));
      },

      initializeEditMenuItemForm: (menuItem: MenuItem) => {
        const initial: MenuItemFormData = {
          title: menuItem.title ?? { en: '', ne: '' },
          description: menuItem.description ?? { en: '', ne: '' },
          url: menuItem.url || '',
          target: menuItem.target,
          icon: menuItem.icon || '',
          order: menuItem.order,
          isActive: menuItem.isActive,
          isVisible: menuItem.isVisible ?? true,
          isPublished: menuItem.isPublished,
          itemType: menuItem.itemType,
          itemId: menuItem.itemId || '',
          categorySlug: menuItem.categorySlug || '', // New field for linking menu item to category
          contentSlug: menuItem.contentSlug || '', // New field for linking menu item to content
        };
        set((state) => ({
          menuItemFormStateById: { ...state.menuItemFormStateById, [menuItem.id]: initial },
          activeMenuItemFormId: menuItem.id,
        }));
      },

      resetCreateForm: () => {
        set({
          createFormState: {
            name: { en: '', ne: '' },
            description: { en: '', ne: '' },
            location: 'HEADER' as any,
            isActive: true,
            isPublished: false,
            categorySlug: '', // New field for linking menu to category
          },
        });
      },

      resetCreateMenuItemForm: () => {
        set({
          createMenuItemFormState: {
            title: { en: '', ne: '' },
            description: { en: '', ne: '' },
            url: '',
            target: 'self',
            icon: '',
            order: 1,
            isActive: true,
            isVisible: true,
            isPublished: false,
            itemType: 'LINK' as any,
            itemId: '',
            categorySlug: '', // New field for linking menu item to category
            contentSlug: '', // New field for linking menu item to content
          },
        });
      },

      updateFormField: (id, field, value) => {
        console.log('🔍 NavigationStore - updateFormField called with:', { id, field, value });
        console.log('🔍 NavigationStore - Current createFormState:', get().createFormState);
        
        if (id === 'create') {
          set((state) => {
            const newState = { ...state.createFormState, [field]: value as any };
            console.log('🔍 NavigationStore - Updating createFormState to:', newState);
            return {
              createFormState: newState,
            };
          });
        } else {
          set((state) => ({
            formStateById: {
              ...state.formStateById,
              [id]: {
                ...(state.formStateById[id] ?? {
                  name: { en: '', ne: '' },
                  description: { en: '', ne: '' },
                  location: 'HEADER' as any,
                  isActive: true,
                  isPublished: false,
                  categorySlug: '', // New field for linking menu to category
                }),
                [field]: value as any,
              },
            },
          }));
        }
        
        console.log('🔍 NavigationStore - After update, new createFormState:', get().createFormState);
      },

      updateMenuItemFormField: (id, field, value) => {
        if (id === 'create') {
          set((state) => ({
            createMenuItemFormState: { ...state.createMenuItemFormState, [field]: value as any },
          }));
        } else {
          set((state) => ({
            menuItemFormStateById: {
              ...state.menuItemFormStateById,
              [id]: {
                ...(state.menuItemFormStateById[id] ?? {
                  title: { en: '', ne: '' },
                  description: { en: '', ne: '' },
                  url: '',
                  target: 'self',
                  icon: '',
                  order: 1,
                  isActive: true,
                  isVisible: true,
                  isPublished: false,
                  itemType: 'LINK' as any,
                  itemId: '',
                  categorySlug: '', // New field for linking menu item to category
                  contentSlug: '', // New field for linking menu item to content
                }),
                [field]: value as any,
              },
            },
          }));
        }
      },

      resetFormState: (id) => {
        if (id === 'create') {
          get().resetCreateForm();
        } else {
          const menu = get().panelMenu;
          const resetTo: MenuFormData = menu && menu.id === id
            ? {
                name: menu.name ?? { en: '', ne: '' },
                description: menu.description ?? { en: '', ne: '' },
                location: menu.location,
                isActive: menu.isActive,
                isPublished: menu.isPublished,
                categorySlug: menu.categorySlug || '', // New field for linking menu to category
              }
            : {
                name: { en: '', ne: '' },
                description: { en: '', ne: '' },
                location: 'HEADER' as any,
                isActive: true,
                isPublished: false,
                categorySlug: '', // New field for linking menu to category
              };

          set((state) => ({
            formStateById: { ...state.formStateById, [id]: resetTo },
          }));
        }
      },

      resetMenuItemFormState: (id) => {
        if (id === 'create') {
          get().resetCreateMenuItemForm();
        } else {
          const menuItem = get().panelMenuItem;
          const resetTo: MenuItemFormData = menuItem && menuItem.id === id
            ? {
                title: menuItem.title ?? { en: '', ne: '' },
                description: menuItem.description ?? { en: '', ne: '' },
                url: menuItem.url || '',
                target: menuItem.target,
                icon: menuItem.icon || '',
                order: menuItem.order,
                isActive: menuItem.isActive,
                isPublished: menuItem.isPublished,
                itemType: menuItem.itemType,
                itemId: menuItem.itemId || '',
                categorySlug: menuItem.categorySlug || '', // New field for linking menu item to category
                contentSlug: menuItem.contentSlug || '', // New field for linking menu item to content
              }
            : {
                title: { en: '', ne: '' },
                description: { en: '', ne: '' },
                url: '',
                target: 'self',
                icon: '',
                order: 1,
                isActive: true,
                isPublished: false,
                itemType: 'LINK' as any,
                itemId: '',
                categorySlug: '', // New field for linking menu item to category
                contentSlug: '', // New field for linking menu item to content
              };

          set((state) => ({
            menuItemFormStateById: { ...state.menuItemFormStateById, [id]: resetTo },
          }));
        }
      },
    }),
    {
      name: 'navigation-ui-store',
      // Only persist pure form fields and lightweight UI flags
      partialize: (state) => ({
        panelMode: state.panelMode,
        isEditing: state.isEditing,
        activeFormId: state.activeFormId,
        activeMenuItemFormId: state.activeMenuItemFormId,
        formStateById: state.formStateById,
        createFormState: state.createFormState,
        menuItemFormStateById: state.menuItemFormStateById,
        createMenuItemFormState: state.createMenuItemFormState,
      }),
    }
  )
);
