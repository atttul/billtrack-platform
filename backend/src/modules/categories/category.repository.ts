import { Category, ICategory } from './category.model.js';
import { Types } from 'mongoose';

export const DEFAULT_CATEGORIES = [
  { name: 'Entertainment', icon: 'tv', color: '#8b5cf6' },
  { name: 'Utilities', icon: 'zap', color: '#f59e0b' },
  { name: 'Rent', icon: 'home', color: '#ef4444' },
  { name: 'Insurance', icon: 'shield', color: '#3b82f6' },
  { name: 'Internet', icon: 'wifi', color: '#06b6d4' },
  { name: 'Education', icon: 'book', color: '#10b981' },
  { name: 'Health', icon: 'heart', color: '#ec4899' },
  { name: 'Other', icon: 'tag', color: '#64748b' },
];

export class CategoryRepository {
  async create(data: Partial<ICategory>): Promise<ICategory> {
    const category = new Category(data);
    return category.save();
  }

  async findAccessibleByUser(userId: string | Types.ObjectId): Promise<ICategory[]> {
    return Category.find({
      $or: [{ userId: new Types.ObjectId(userId) }, { userId: null }],
    }).sort({ name: 1 }).exec();
  }

  async findById(id: string | Types.ObjectId): Promise<ICategory | null> {
    return Category.findById(id).exec();
  }

  async findByNameAndUser(name: string, userId: string | Types.ObjectId): Promise<ICategory | null> {
    return Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      $or: [{ userId: new Types.ObjectId(userId) }, { userId: null }],
    }).exec();
  }

  async update(id: string | Types.ObjectId, data: Partial<ICategory>): Promise<ICategory | null> {
    return Category.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
  }

  async delete(id: string | Types.ObjectId): Promise<ICategory | null> {
    return Category.findByIdAndDelete(id).exec();
  }

  async seedDefaultCategoriesForUser(userId: Types.ObjectId): Promise<void> {
    const defaultDocs = DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      userId,
    }));
    await Category.insertMany(defaultDocs, { ordered: false }).catch(() => {
      // Ignore duplicate key errors if already seeded
    });
  }
}

export const categoryRepository = new CategoryRepository();
