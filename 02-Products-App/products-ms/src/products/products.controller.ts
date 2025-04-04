import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Logger } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern({ cmd: 'create-product' })
  create(@Payload() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @MessagePattern({ cmd: 'find-all-products' })
  findAll(@Payload() paginationDto: PaginationDto) {
    return this.productsService.findAll(paginationDto);
  }

  @MessagePattern({ cmd: 'find-one-product' })
  findOne(@Payload('id', ParseIntPipe) id: number) {
    this.logger.log('findOne', id);
    return this.productsService.findOne(id);
  }

  @MessagePattern({ cmd: 'update-product' })
  update(@Payload() updateProductDto: UpdateProductDto) {
    return this.productsService.update(updateProductDto.id, updateProductDto);
  }

  @MessagePattern({ cmd: 'remove-product' })
  remove(@Payload('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
