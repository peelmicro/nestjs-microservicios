import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, Inject } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ORDERS_SERVICE } from 'src/config';
import { catchError, firstValueFrom } from 'rxjs';

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    @Inject(ORDERS_SERVICE) private readonly ordersClient: ClientProxy,
  ) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersClient.send(
      'createOrder',
      createOrderDto,
    );
  }

  @Get()
  findAll() {
    return this.ordersClient.send(
      'findAllOrders',
      {},
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersClient.send(
      'findOneOrder',
      { id: +id },
    );
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersClient.send(
      'changeOrderStatus',
      { id: +id, updateOrderDto },
    );
  }
}
