import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { envs, ORDERS_SERVICE } from 'src/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  controllers: [OrdersController],
  providers: [],
  imports: [
    ClientsModule.register([
      {
        name: ORDERS_SERVICE,
        transport: Transport.TCP,
        options: {
          host: envs.ordersMicroserviceHost,
          port: envs.ordersMicroservicePort,
        },
      },
    ]),
  ],  
})
export class OrdersModule {}
