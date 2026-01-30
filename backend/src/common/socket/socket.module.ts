import { Global, Module } from '@nestjs/common';
import { Socket } from 'socket.io';
import { SocketService } from './socket.service';

@Global()
@Module({
  providers: [SocketService],
  exports: [SocketService],
})
export class SocketModule { }
