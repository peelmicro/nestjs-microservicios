import { Controller, ParseUUIDPipe, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { OrderWithProducts } from './interfaces/order-with-produts.interface';
import { PaidOrderDto } from './dto/paid-order.dto';

const debug = false;
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  private readonly logger = new Logger(OrdersController.name);

  @MessagePattern('createOrder')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.create(createOrderDto);
    const paymentSession = await this.ordersService.createPaymentSession(
      order as OrderWithProducts,
    );

    return {
      order,
      paymentSession,
    };
  }

  @MessagePattern('findAllOrders')
  findAll(@Payload() orderPaginationDto: OrderPaginationDto) {
    return this.ordersService.findAll(orderPaginationDto);
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern('changeOrderStatus')
  changeOrderStatus(@Payload() changeOrderStatusDto: ChangeOrderStatusDto) {
    return this.ordersService.changeStatus(changeOrderStatusDto);
  }

  @EventPattern('payment.succeeded')
  paidOrder(@Payload() paidOrderDto: PaidOrderDto) {
    if (debug) {
      this.logger.log('Payment succeeded');
      this.logger.log(paidOrderDto);
    }
    return this.ordersService.paidOrder(paidOrderDto);
  }
}
