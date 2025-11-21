import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './schemas/user.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

type SafeUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  private buildSafeUser(user: User): SafeUser {
    const { _id, name, email, role } = user;
    const normalizedId =
      _id instanceof Types.ObjectId ? _id.toString() : String(_id);
    return {
      _id: normalizedId,
      name,
      email,
      role,
    };
  }

  async create(createUserData: CreateUserDto): Promise<SafeUser> {
    const { email, password } = createUserData;

    const emailExists = await this.userModel.findOne({ email });
    if (emailExists) throw new BadRequestException('Email already in use');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      ...createUserData,
      password: hashedPassword,
    });

    const savedUser = await user.save();
    return this.buildSafeUser(savedUser);
  }

  async findAll(): Promise<SafeUser[]> {
    const allUsers = await this.userModel.find().exec();
    return allUsers.map((user) => this.buildSafeUser(user));
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return this.buildSafeUser(user);
  }

  async update(id: string, updateUserData: UpdateUserDto): Promise<SafeUser> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserData, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return this.buildSafeUser(updatedUser);
  }

  async remove(id: string): Promise<SafeUser> {
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();

    if (!deletedUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return this.buildSafeUser(deletedUser);
  }
}
