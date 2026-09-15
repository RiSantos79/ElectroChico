import { SetMetadata } from '@nestjs/common';
import type { Action, Module } from '../common/permissions.js';

export const PERMISSION_KEY = 'requiredPermission';

export const RequirePermission = (module: Module, action: Action) =>
  SetMetadata(PERMISSION_KEY, { module, action });
