import { api } from './api';
import { Category, CreateCategoryPayload, UpdateCategoryPayload } from '../types/category';
import { ApiResponseWrapper } from './auth.service';

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const res = (await api.get('/categories')) as unknown as ApiResponseWrapper<Category[]>;
    return res.data;
  },

  async createCategory(payload: CreateCategoryPayload): Promise<Category> {
    const res = (await api.post('/categories', payload)) as unknown as ApiResponseWrapper<Category>;
    return res.data;
  },

  async updateCategory(id: string, payload: UpdateCategoryPayload): Promise<Category> {
    const res = (await api.patch(`/categories/${id}`, payload)) as unknown as ApiResponseWrapper<Category>;
    return res.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
