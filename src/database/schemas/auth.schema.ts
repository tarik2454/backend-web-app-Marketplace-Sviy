import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuthDocument = Auth & Document;

@Schema({ collection: 'users' })
export class Auth {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true, minlength: 6 })
  password: string;
}

export const AuthSchema = SchemaFactory.createForClass(Auth);
