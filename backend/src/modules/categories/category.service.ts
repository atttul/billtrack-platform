import { categoryRepository, CategoryRepository } from './category.repository.js';
import { CreateCategoryInput, UpdateCategoryInput } from './category.validation.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../../utils/errors.js';
import { Types } from 'mongoose';

export class CategoryService {
  constructor(private categoryRepo: CategoryRepository = categoryRepository) {}

  async createCategory(userId: string, input: CreateCategoryInput) {
    const existing = await this.categoryRepo.findByNameAndUser(input.name, userId);
    if (existing) {
      throw new ConflictError('Category with this name already exists');
    }

    return this.categoryRepo.create({
      ...input,
      userId: new Types.ObjectId(userId),
    });
  }

  async getUserCategories(userId: string) {
    return this.categoryRepo.findAccessibleByUser(userId);
  }

  async updateCategory(userId: string, categoryId: string, input: UpdateCategoryInput) {
    const category = await this.categoryRepo.findById(categoryId);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (!category.userId || category.userId.toString() !== userId) {
      throw new ForbiddenError('Cannot edit system or default categories');
    }

    if (input.name && input.name.toLowerCase() !== category.name.toLowerCase()) {
      const existing = await this.categoryRepo.findByNameAndUser(input.name, userId);
      if (existing) {
        throw new ConflictError('Category with this name already exists');
      }
    }

    return this.categoryRepo.update(categoryId, input);
  }

  async deleteCategory(userId: string, categoryId: string) {
    const category = await this.categoryRepo.findById(categoryId);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (!category.userId || category.userId.toString() !== userId) {
      throw new ForbiddenError('Cannot delete system or default categories');
    }

    return this.categoryRepo.delete(categoryId);
  }
}

export const categoryService = new CategoryService();
