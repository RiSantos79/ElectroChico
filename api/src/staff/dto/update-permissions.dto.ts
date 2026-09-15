import { IsObject, IsOptional } from 'class-validator';

// Validado à mão no serviço contra MODULES/ACTIONS (common/permissions.ts) —
// a forma é demasiado dinâmica (16 módulos x 5 ações) para valer a pena
// decorar campo a campo com class-validator.
export class UpdatePermissionsDto {
  @IsOptional()
  @IsObject()
  overrides?: Record<string, Record<string, boolean>> | null;
}
