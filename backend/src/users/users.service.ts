import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { mongo, type Model } from 'mongoose';
import { ApiError } from '../api-error.js';
import { User } from './user.schema.js';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(@InjectModel(User.name) private readonly users: Model<User>) {}

  async onModuleInit() {
    await this.users.init();
  }

  async create(user: User) {
    try {
      return await this.users.create(user);
    } catch (error) {
      if (error instanceof mongo.MongoServerError && error.code === 11000) {
        throw new ApiError(409, 'An account already exists for this email.', {
          email: 'An account already exists for this email.',
        });
      }
      throw error;
    }
  }

  findForSignIn(email: string) {
    return this.users.findOne({ email }).select('+passwordHash').exec();
  }

  findById(id: string) {
    return this.users.findById(id).exec();
  }
}
