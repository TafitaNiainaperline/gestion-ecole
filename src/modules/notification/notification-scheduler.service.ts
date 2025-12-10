import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { NotificationStatus } from '../../commons/enums';
import { StudentService } from '../student/student.service';
import { SmsService } from '../sms/sms.service';
import { SmsLogService } from '../sms-log/sms-log.service';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private studentService: StudentService,
    private smsService: SmsService,
    private smsLogService: SmsLogService,
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

        // Send the notification
        await this.sendNotification(notification);

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

    // Send the notification
    await this.sendNotification(notification);

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

  /**
   * Send notification to all targeted recipients
   */
  private async sendNotification(notification: any): Promise<void> {
    try {
      // Get target students based on targetType
      const targetStudents = await this.getTargetStudents(notification);

      let successCount = 0;
      let failureCount = 0;

      // Send SMS to each student's parent
      for (const student of targetStudents) {
        try {
          const parent = student.parentId;

          if (!parent || !parent.phone) {
            this.logger.warn(
              `Student ${student._id} has no parent phone number`,
            );
            failureCount++;
            continue;
          }

          // Build personalized message
          const message = this.buildMessage(
            notification.message,
            parent,
            student,
          );

          // Send SMS
          await this.smsService.sendSms(parent.phone, message);

          // Create SMS log
          await this.smsLogService.create({
            notificationId: notification._id,
            parentId: parent._id,
            studentId: student._id,
            phoneNumber: parent.phone,
            message,
            status: 'SENT',
            sentAt: new Date(),
          });

          successCount++;
        } catch (error) {
          this.logger.error(
            `Failed to send SMS for student ${student._id}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          );
          failureCount++;
        }
      }

      // Update notification counts
      await this.notificationModel.findByIdAndUpdate(
        notification._id,
        {
          totalRecipients: successCount + failureCount,
          successCount,
          failureCount,
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
        { new: true },
      );

      this.logger.log(
        `Notification ${notification._id}: ${successCount} sent, ${failureCount} failed`,
      );
    } catch (error) {
      this.logger.error(
        `Error sending notification ${notification._id}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error;
    }
  }

  /**
   * Get target students based on notification targetType
   */
  private async getTargetStudents(notification: any): Promise<any[]> {
    const { targetType, targetClasses, targetStudents } = notification;

    if (targetType === 'CLASSE') {
      // Get all students from target classes
      const students = await Promise.all(
        targetClasses.map((classe: string) =>
          this.studentService.findByClasse(classe),
        ),
      );
      return students.flat();
    }

    if (targetType === 'INDIVIDUEL') {
      // Get specific target students
      const students = await Promise.all(
        targetStudents.map((studentId: string) =>
          this.studentService.findById(studentId),
        ),
      );
      return students;
    }

    if (targetType === 'TOUS') {
      // Get all students
      return this.studentService.findAll();
    }

    return [];
  }

  /**
   * Build personalized message with parent and student data
   */
  private buildMessage(
    template: string,
    parent: any,
    student: any,
  ): string {
    let message = template;

    // Replace placeholders with actual data
    message = message.replace(/{parentName}/g, parent.name || '');
    message = message.replace(/{parentPhone}/g, parent.phone || '');
    message = message.replace(/{studentFirstName}/g, student.firstName || '');
    message = message.replace(/{studentLastName}/g, student.lastName || '');
    message = message.replace(
      /{studentFullName}/g,
      `${student.firstName} ${student.lastName}`,
    );
    message = message.replace(/{matricule}/g, student.matricule || '');
    message = message.replace(/{classe}/g, student.classe || '');
    message = message.replace(/{niveau}/g, student.niveau || '');
    message = message.replace(/{status}/g, student.status || '');

    return message;
  }
}
