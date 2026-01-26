import { Global, Module } from '@nestjs/common';
import { WebsocketSessionService } from './websocket-session.service';

@Global()
@Module({
  providers: [WebsocketSessionService],
  exports: [WebsocketSessionService],
})
export class WebsocketModule {}
