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

          await this.smsLogService.create({
            notificationId: notification._id,
            notificationTitle: notification.title,
            notificationType: notification.type,
            parentId: parent._id,
            studentId: student._id,
            phoneNumber: parent.phone,
            message,
            status: smsResult.success ? 'SENT' : 'FAILED',
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
      const students = await Promise.all(
        targetStudents.map((studentId: string) =>
          this.studentService.findById(studentId),
        ),
      );
      this.logger.log(`Found ${students.length} individual students`);
      return students;
    }
    if (targetType === 'TOUS') {
      const allStudents = await this.studentService.findAll();
      this.logger.log(`Found ${allStudents.length} students (all)`);
      return allStudents;
    }
    this.logger.warn(`Unknown targetType: ${targetType}`);
    return [];
  }
 
  private buildMessage(
    template: string,
    parent: any,
    student: any,
  ): string {
    let message = template;
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

  async sendImmediate(
    sendImmediateDto: SendImmediateDto,
  ): Promise<{ success: boolean; message: string; stats: any }> {
    try {
      this.logger.log('Sending immediate SMS notification');
      const tempNotification = {
        _id: 'immediate-' + Date.now(),
        type: sendImmediateDto.type,
        title: sendImmediateDto.title,
        message: sendImmediateDto.message,
        targetType: sendImmediateDto.targetType,
        targetClasses: sendImmediateDto.targetClasses,
        targetStudents: sendImmediateDto.targetStudents,
      };

      const targetStudents = await this.getTargetStudents(tempNotification);
      this.logger.log(`Processing ${targetStudents.length} target students for immediate send`);

      const phoneMapping: Array<{
        phone: string;
        parent: any;
        student: any;
        message: string;
      }> = [];
      let invalidCount = 0;

      for (const student of targetStudents) {
        const parent = student.parentId;

        if (!parent) {
          this.logger.warn(
            `Student ${student._id} (${student.firstName} ${student.lastName}) has no parent associated`,
          );
          invalidCount++;
          continue;
        }

        if (!parent.phone) {
          this.logger.warn(
            `Parent ${parent._id} for student ${student._id} has no phone number`,
          );
          invalidCount++;
          continue;
        }

        const message = this.buildMessage(
          sendImmediateDto.message,
          parent,
          student,
        );

        phoneMapping.push({
          phone: parent.phone,
          parent,
          student,
          message,
        });
      }

      this.logger.log(
        `Prepared ${phoneMapping.length} valid phone numbers (${invalidCount} invalid)`,
      );

      if (phoneMapping.length === 0) {
        this.logger.warn('No valid phone numbers to send SMS');
        return {
          success: false,
          message: 'Aucun numéro de téléphone valide trouvé',
          stats: {
            totalRecipients: 0,
            sentCount: 0,
            failureCount: invalidCount,
            smsLogIds: [],
          },
        };
      }

      const phoneNumbers = phoneMapping.map((p) => p.phone);
      const messageToSend = phoneMapping[0].message;

      this.logger.log(
        ` Calling external API with ${phoneNumbers.length} phone numbers in ONE request`,
      );

      const smsResult = await this.smsService.sendSms(phoneNumbers, messageToSend);

      // Extract messageIds and individual statuses from response
      const messageIds = smsResult.messageIds || (smsResult.messageId ? [smsResult.messageId] : []);
      const smsStatuses = smsResult.smsStatuses || [];

      this.logger.log(
        `API Response: success=${smsResult.success}, messageIds=${JSON.stringify(messageIds)}`,
      );

      if (smsStatuses.length > 0) {
        this.logger.log(`Individual SMS Statuses: ${JSON.stringify(smsStatuses)}`);
      }

      const smsLogIds: string[] = [];
      let sentCount = 0;
      let failureCount = 0;

      for (let i = 0; i < phoneMapping.length; i++) {
        const { phone, parent, student, message } = phoneMapping[i];
        const messageId = messageIds[i] || null;

        try {
          // ✅ NEW: Use individual status from API response
          let logStatus = 'FAILED';  // Default to FAILED

          // Try to get status from smsStatuses array (individual status)
          if (smsStatuses.length > i && smsStatuses[i]) {
            logStatus = smsStatuses[i].status;
          }
          // Fallback: Use global success if no individual status available
          else if (smsResult.success) {
            logStatus = 'SENT';
          }

          const smsLog = await this.smsLogService.create({
            notificationId: null,
            notificationTitle: sendImmediateDto.title,
            notificationType: sendImmediateDto.type,
            parentId: parent._id,
            studentId: student._id,
            phoneNumber: phone,
            message,
            status: logStatus,  // ← Use individual status, not global success
          });

          smsLogIds.push((smsLog as any)._id.toString());

          if (logStatus === 'SENT' || logStatus === 'DELIVERED') {
            sentCount++;
            this.logger.log(
              `✅ SMS Log created for ${phone} with status ${logStatus} (messageId: ${messageId})`,
            );
          } else {
            failureCount++;
            this.logger.error(
              `❌ SMS Log created with ${logStatus} status for ${phone}${
                smsStatuses[i]?.error ? `: ${smsStatuses[i].error}` : ''
              }`,
            );
          }
        } catch (dbError) {
          this.logger.error(
            `Failed to create SMS log for student ${student._id}: ${
              dbError instanceof Error ? dbError.message : 'Unknown error'
            }`,
          );
          failureCount++;
        }
      }

      this.logger.log(
        `Immediate send completed: ${sentCount} sent, ${failureCount} failed, ${invalidCount} invalid`,
      );

      return {
        success: smsResult.success,
        message: `SMS envoyés: ${sentCount} envoyés, ${failureCount} échoués, ${invalidCount} invalides`,
        stats: {
          totalRecipients: sentCount + failureCount,
          sentCount,
          failureCount,
          invalidCount,
          smsLogIds,
          messageIds, 
          apiResponse: {
            success: smsResult.success,
            message: smsResult.message,
          },
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
