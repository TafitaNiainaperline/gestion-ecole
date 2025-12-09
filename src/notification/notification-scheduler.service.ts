import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { NotificationStatus } from '../commons/enums';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  /**
   * Check for scheduled notifications every minute
   * and send them if the scheduled time has passed
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledNotifications() {
    try {
      const now = new Date();

      // Find all notifications that:
      // 1. Have scheduledAt <= now
      // 2. Status is DRAFT (not yet sent)
      const scheduledNotifications = await this.notificationModel.find({
        scheduledAt: { $lte: now },
        status: NotificationStatus.DRAFT,
      });

      for (const notification of scheduledNotifications) {
        this.logger.log(
          `Sending scheduled notification: ${notification._id}`,
        );
        // Update status to SENDING
        await this.notificationModel.findByIdAndUpdate(
          notification._id,
          { status: NotificationStatus.SENDING },
          { new: true },
        );

        // TODO: Implement actual SMS sending logic here
        // This would call the SMS service to send the notification
        // to all targeted recipients

        // For now, we just mark it as SENT
        await this.notificationModel.findByIdAndUpdate(
          notification._id,
          { status: NotificationStatus.SENT, sentAt: new Date() },
          { new: true },
        );

        this.logger.log(
          `Notification sent successfully: ${notification._id}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error processing scheduled notifications: ${error.message}`,
      );
    }
  }

  /**
   * Manually trigger sending of a scheduled notification
   */
  async sendNow(notificationId: string): Promise<Notification> {
    const notification = await this.notificationModel.findByIdAndUpdate(
      notificationId,
      { status: NotificationStatus.SENDING },
      { new: true },
    );

    if (!notification) {
      throw new Error(`Notification with ID ${notificationId} not found`);
    }

    // TODO: Implement actual SMS sending logic here

    const sentNotification = await this.notificationModel.findByIdAndUpdate(
      notificationId,
      { status: NotificationStatus.SENT, sentAt: new Date() },
      { new: true },
    );

    if (!sentNotification) {
      throw new Error(`Failed to update notification ${notificationId}`);
    }

    return sentNotification as Notification;
  }
}
