import { httpClient } from '@/lib/api/http-client';
import { 
  Category, 
  CreateCategoryRequest, 
  UpdateCategoryRequest, 
  CategoryListResponse, 
  CategoryQuery
} from '../types/content';

/**
 * Repository responsible for direct API interactions for Categories.
 * This layer should be the ONLY place that talks to the HTTP client.
 */
export interface CategoryRepository {
  getCategories(query?: CategoryQuery): Promise<CategoryListResponse>;
  getCategoryTree(): Promise<CategoryListResponse>;
  getCategoryById(id: string): Promise<Category>;
  createCategory(data: CreateCategoryRequest): Promise<Category>;
  updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
}

class CategoryRepositoryImpl implements CategoryRepository {
  private readonly BASE_URL = '/admin/categories';

  /**
   * Get all categories with filtering and pagination
   */
  async getCategories(query: CategoryQuery = {}): Promise<CategoryListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);
      
      // Add filters if they exist
      if (query.filters) {
        if (query.filters.search) params.append('search', query.filters.search);
        if (query.filters.parentId) params.append('parentId', query.filters.parentId);
        if (query.filters.isActive !== undefined) params.append('isActive', query.filters.isActive.toString());
        if (query.filters.level !== undefined) params.append('level', query.filters.level.toString());
      }

      const response = await httpClient.get(`${this.BASE_URL}?${params.toString()}`);
      // Handle the actual API response format
      if (!response.data || typeof response.data !== 'object') {
        return {
          data: [],
          pagination: {
            page: query.page || 1,
            limit: query.limit || 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        } as CategoryListResponse;
      }

      // The API returns { success: true, data: [...], meta: {...} }
      const apiData = response.data as any;
      
      if (!apiData || !Array.isArray(apiData)) {
        return {
          data: [],
          pagination: {
            page: query.page || 1,
            limit: query.limit || 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        } as CategoryListResponse;
      }
      
      // Transform API response to expected format
      return {
        data: apiData,
        pagination: {
          page: query.page || 1,
          limit: query.limit || 10,
          total: apiData.length,
          totalPages: Math.ceil(apiData.length / (query.limit || 10)),
          hasNext: false,
          hasPrev: false
        }
      } as CategoryListResponse;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      throw error;
    }
  }

  /**
   * Get hierarchical category tree
   */
  async getCategoryTree(): Promise<CategoryListResponse> {
    try {
      const response = await httpClient.get(`${this.BASE_URL}/tree`);
      
      // Handle the actual API response format
      if (!response.data || typeof response.data !== 'object') {
        return {
          data: [],
          pagination: {
            page: 1,
            limit: 100,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        } as CategoryListResponse;
      }

      // The API returns { success: true, data: [...], meta: {...} }
      const apiData = response.data as any;
      
      if (!apiData.data || !Array.isArray(apiData.data)) {
        return {
          data: [],
          pagination: {
            page: 1,
            limit: 100,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        } as CategoryListResponse;
      }
      
      // Transform API response to expected format
      return {
        data: apiData.data,
        pagination: {
          page: 1,
          limit: 100,
          total: apiData.data.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      } as CategoryListResponse;
    } catch (error) {
      console.error('Failed to fetch category tree:', error);
      throw error;
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<Category> {
    try {
      const response = await httpClient.get(`${this.BASE_URL}/${id}`);
      
      // Handle the API response format { success: true, data: {...}, meta: {...} }
      const apiData = response.data as any;
      
      if (apiData && apiData.data) {
        return apiData.data as Category;
      }
      
      // Fallback to direct response if structure is different
      if (response.data) {
        return response.data as Category;
      }
      
      throw new Error('Invalid response structure');
    } catch (error) {
      console.error(`Failed to fetch category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new category
   */
  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    try {
      const response = await httpClient.post(this.BASE_URL, data);
      
      // Handle the API response format { success: true, data: {...}, meta: {...} }
      const apiData = response.data as any;
      
      if (apiData && apiData.data) {
        return apiData.data as Category;
      }
      
      // Fallback to direct response if structure is different
      return response.data as Category;
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  }

  /**
   * Update category
   */
  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
    try {
      const response = await httpClient.put(`${this.BASE_URL}/${id}`, data);
      
      // Handle the API response format { success: true, data: {...}, meta: {...} }
      const apiData = response.data as any;
      
      if (apiData && apiData.data) {
        return apiData.data as Category;
      }
      
      // Fallback to direct response if structure is different
      return response.data as Category;
    } catch (error) {
      console.error(`Failed to update category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      await httpClient.delete(`${this.BASE_URL}/${id}`);
    } catch (error) {
      console.error(`Failed to delete category ${id}:`, error);
      throw error;
    }
  }
}

export const categoryRepository: CategoryRepository = new CategoryRepositoryImpl(); 