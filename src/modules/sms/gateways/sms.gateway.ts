import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
export interface SmsStatusUpdate {
  smsLogId: string;
  messageId: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  phone: string;
  content?: string;
  updatedAt: string;
  errorMessage?: string;
}
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/sms',
})
export class SmsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SmsGateway.name);
  @WebSocketServer()
  server: Server;
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
  /**
   * Emit SMS status update to all connected clients
   */
  emitSmsStatusUpdate(update: SmsStatusUpdate) {
    this.logger.log(`Emitting SMS status update: ${JSON.stringify(update)}`);
    this.server.emit('sms-status-update', update);
  }
  /**
   * Emit multiple SMS status updates
   */
  emitBulkSmsStatusUpdate(updates: SmsStatusUpdate[]) {
    this.logger.log(`Emitting ${updates.length} SMS status updates`);
    this.server.emit('sms-bulk-status-update', updates);
  }
}