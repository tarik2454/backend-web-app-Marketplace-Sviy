import {
  SubscribeMessage,
  WebSocketGateway,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway(3002, {})
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('newMessage')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: unknown,
  ) {
    console.log('Received message:', message);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    client.emit('reply', 'This is a reply');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.server.emit('reply', 'broadcasting...');
  }
}
