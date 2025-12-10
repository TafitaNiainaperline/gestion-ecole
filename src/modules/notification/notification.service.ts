import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const newNotification = new this.notificationModel(createNotificationDto);
    return newNotification.save();
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationModel.find().populate('createdBy');
  }

  async findScheduled(): Promise<Notification[]> {
    // Only return notifications that are DRAFT (not sent yet)
    return this.notificationModel
      .find({ status: 'DRAFT' })
      .sort({ scheduledAt: 1 })
      .populate('createdBy');
  }

  async findById(id: string): Promise<Notification> {
    const notification = await this.notificationModel.findById(id).populate('createdBy');

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async updateStatus(id: string, status: string): Promise<Notification> {
    const notification = await this.notificationModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async updateCounts(
    id: string,
    successCount: number,
    failureCount: number,
  ): Promise<Notification> {
    const notification = await this.notificationModel.findByIdAndUpdate(
      id,
      {
        successCount,
        failureCount,
        totalRecipients: successCount + failureCount,
      },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async markAsSent(id: string): Promise<Notification> {
    const notification = await this.notificationModel.findByIdAndUpdate(
      id,
      { status: 'SENT', sentAt: new Date() },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification as Notification;
  }
}
