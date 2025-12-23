import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { NotificationStatus } from '../../commons/enums';
import { StudentService } from '../student/student.service';
import { SmsService } from '../sms/sms.service';
import { SmsLogService } from '../sms-log/sms-log.service';
import { SendImmediateDto } from './dto/send-immediate.dto';
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
  async sendNow(notificationId: string): Promise<{ message: string; stats: any }> {
    const notification = await this.notificationModel.findByIdAndUpdate(
      notificationId,
      { status: NotificationStatus.SENDING },
      { new: true },
    );
    if (!notification) {
      throw new Error(`Notification with ID ${notificationId} not found`);
    }
    // Send the notification (this will also delete it)
    await this.sendNotification(notification);
    return {
      message: 'Notification sent and removed from scheduled notifications',
      stats: {
        totalRecipients: notification.totalRecipients,
        successCount: notification.successCount,
        failureCount: notification.failureCount,
      },
    };
  }
  /**
   * Send notification to all targeted recipients
   */
  private async sendNotification(notification: any): Promise<void> {
    try {
      // Get target students based on targetType
      const targetStudents = await this.getTargetStudents(notification);
      this.logger.log(`Processing ${targetStudents.length} target students`);
      let successCount = 0;
      let failureCount = 0;
      // Send SMS to each student's parent
      for (const student of targetStudents) {
        try {
          this.logger.log(`Processing student: ${student._id} (${student.firstName} ${student.lastName})`);
          const parent = student.parentId;
          if (!parent) {
            this.logger.warn(
              `Student ${student._id} (${student.firstName} ${student.lastName}) has no parent associated`,
            );
            failureCount++;
            continue;
          }
          if (!parent.phone) {
            this.logger.warn(
              `Parent ${parent._id} for student ${student._id} has no phone number`,
            );
            failureCount++;
            continue;
          }
          this.logger.log(`Sending SMS to parent ${parent.name} (${parent.phone})`);
          // Build personalized message
          const message = this.buildMessage(
            notification.message,
            parent,
            student,
          );
          // Send SMS
          const smsResult = await this.smsService.sendSms(parent.phone, message);
          // Create SMS log with PENDING status and store messageId
          await this.smsLogService.create({
            notificationId: notification._id,
            notificationTitle: notification.title,
            notificationType: notification.type,
            parentId: parent._id,
            studentId: student._id,
            phoneNumber: parent.phone,
            message,
            status: smsResult.success ? 'PENDING' : 'FAILED',
            smsServerId: smsResult.messageId, // Store the messageId from API
            errorMessage: smsResult.success ? undefined : (smsResult.error || smsResult.message),
          });
          if (smsResult.success) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (error) {
          this.logger.error(
            `Failed to send SMS for student ${student._id}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          );
          failureCount++;
        }
      }
      // Update notification counts and mark as sent
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
      // Delete the notification after successful sending
      // The SMS logs are preserved for history
      await this.notificationModel.findByIdAndDelete(notification._id);
      this.logger.log(
        `Notification ${notification._id} deleted from scheduled notifications`,
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
    this.logger.log(`Getting target students for targetType: ${targetType}`);
    this.logger.log(`targetClasses: ${JSON.stringify(targetClasses)}`);
    this.logger.log(`targetStudents: ${JSON.stringify(targetStudents)}`);
    if (targetType === 'CLASSE') {
      if (!targetClasses || targetClasses.length === 0) {
        this.logger.warn('No target classes specified');
        return [];
      }
      // Get all students from target classes
      const students = await Promise.all(
        targetClasses.map((classe: string) =>
          this.studentService.findByClasse(classe),
        ),
      );
      const flatStudents = students.flat();
      this.logger.log(`Found ${flatStudents.length} students in target classes`);
      return flatStudents;
    }
    if (targetType === 'INDIVIDUEL') {
      if (!targetStudents || targetStudents.length === 0) {
        this.logger.warn('No target students specified');
        return [];
      }
      // Get specific target students
      const students = await Promise.all(
        targetStudents.map((studentId: string) =>
          this.studentService.findById(studentId),
        ),
      );
      this.logger.log(`Found ${students.length} individual students`);
      return students;
    }
    if (targetType === 'TOUS') {
      // Get all students
      const allStudents = await this.studentService.findAll();
      this.logger.log(`Found ${allStudents.length} students (all)`);
      return allStudents;
    }
    this.logger.warn(`Unknown targetType: ${targetType}`);
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
  /**
   * Send SMS immediately without scheduling
   * Uses REST-based bulk approach - all SMS sent in one request with immediate response
   */
  async sendImmediate(
    sendImmediateDto: SendImmediateDto,
  ): Promise<{ success: boolean; message: string; stats: any }> {
    try {
      this.logger.log('Sending immediate SMS notification (REST bulk approach)');

      // Create a temporary notification object for processing
      const tempNotification = {
        _id: 'immediate-' + Date.now(),
        type: sendImmediateDto.type,
        title: sendImmediateDto.title,
        message: sendImmediateDto.message,
        targetType: sendImmediateDto.targetType,
        targetClasses: sendImmediateDto.targetClasses,
        targetStudents: sendImmediateDto.targetStudents,
      };

      // Get target students
      const targetStudents = await this.getTargetStudents(tempNotification);
      this.logger.log(`Processing ${targetStudents.length} target students for immediate send`);

      // Prepare recipients with their personalized messages
      interface RecipientData {
        student: any;
        parent: any;
        phone: string;
        message: string;
      }

      const recipients: RecipientData[] = [];
      let skippedCount = 0;

      // Build list of valid recipients
      for (const student of targetStudents) {
        const parent = student.parentId;

        if (!parent) {
          this.logger.warn(
            `Student ${student._id} (${student.firstName} ${student.lastName}) has no parent associated`,
          );
          skippedCount++;
          continue;
        }

        if (!parent.phone) {
          this.logger.warn(
            `Parent ${parent._id} for student ${student._id} has no phone number`,
          );
          skippedCount++;
          continue;
        }

        // Build personalized message
        const message = this.buildMessage(
          sendImmediateDto.message,
          parent,
          student,
        );

        recipients.push({
          student,
          parent,
          phone: parent.phone,
          message,
        });
      }

      if (recipients.length === 0) {
        this.logger.warn('No valid recipients found');
        return {
          success: false,
          message: 'Aucun destinataire valide trouvé',
          stats: {
            totalRecipients: 0,
            sentCount: 0,
            failedCount: skippedCount,
            smsLogIds: [],
          },
        };
      }

      // Group recipients by message content (for bulk sending)
      // Note: If all messages are the same, we can send all in one request
      // For personalized messages, we may need multiple requests
      const messageGroups = new Map<string, RecipientData[]>();
      recipients.forEach(r => {
        const existing = messageGroups.get(r.message) || [];
        existing.push(r);
        messageGroups.set(r.message, existing);
      });

      let sentCount = 0;
      let failedCount = skippedCount;
      const smsLogIds: string[] = [];
      const results: any[] = [];

      // Send SMS for each message group
      for (const [message, groupRecipients] of messageGroups) {
        const phones = groupRecipients.map(r => r.phone);

        this.logger.log(`📤 Sending bulk SMS to ${phones.length} recipients`);

        // Use the new REST-based multi SMS
        const smsResult = await this.smsService.sendMultiSms(phones, message);

        // Create a map of results by phone for quick lookup
        const resultsByPhone = new Map<string, any>();
        smsResult.results.forEach(r => {
          resultsByPhone.set(r.phone, r);
        });

        // Create SMS logs for each recipient
        for (const recipient of groupRecipients) {
          const formattedPhone = recipient.phone.replace(/\s+/g, '').replace(/^\+261/, '0');
          const apiRes = resultsByPhone.get(formattedPhone);

          try {
            // Create SMS log entry with final status
            const smsLog = await this.smsLogService.create({
              notificationId: null,
              notificationTitle: sendImmediateDto.title,
              notificationType: sendImmediateDto.type,
              parentId: recipient.parent._id,
              studentId: recipient.student._id,
              phoneNumber: formattedPhone,
              message: recipient.message,
              status: apiRes?.success ? 'SENT' : 'FAILED',
              smsServerId: apiRes?.smsLogId || null,
              errorMessage: apiRes?.success ? undefined : (apiRes?.error || 'Unknown error'),
              sentAt: apiRes?.success ? new Date() : undefined,
            });

            const logId = (smsLog as any)._id.toString();
            smsLogIds.push(logId);

            if (apiRes?.success) {
              sentCount++;
              results.push({
                phone: formattedPhone,
                success: true,
                smsLogId: logId,
                externalSmsId: apiRes.smsLogId,
                status: apiRes.status || 'SENT',
              });
            } else {
              failedCount++;
              results.push({
                phone: formattedPhone,
                success: false,
                smsLogId: logId,
                error: apiRes?.error || 'Unknown error',
              });
            }
          } catch (error) {
            this.logger.error(
              `Failed to create SMS log for ${formattedPhone}: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            );
            failedCount++;
          }
        }
      }

      this.logger.log(
        `✅ Immediate send completed: ${sentCount} sent, ${failedCount} failed`,
      );

      return {
        success: sentCount > 0,
        message: `SMS envoyés: ${sentCount} réussis, ${failedCount} échoués`,
        stats: {
          totalRecipients: sentCount + failedCount,
          sentCount,
          failedCount,
          smsLogIds,
          results,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error sending immediate SMS: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error;
    }
  }
}
