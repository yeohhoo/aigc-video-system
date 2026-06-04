import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { VolcengineClient } from '../../integrations/volcengine/volcengine.client';
import { CreateCreationTaskDto } from './dto/create-creation-task.dto';

@Injectable()
export class CreationService {
  constructor(private readonly volcengineClient: VolcengineClient) {}

  list() {
    return [];
  }

  create(dto: CreateCreationTaskDto) {
    return {
      id: randomUUID(),
      status: 'pending',
      integrationReady: Boolean(this.volcengineClient),
      ...dto,
    };
  }
}
