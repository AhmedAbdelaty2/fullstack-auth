import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: false })
export class Session {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ type: Date, required: true, expires: 0 })
  expiresAt!: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
