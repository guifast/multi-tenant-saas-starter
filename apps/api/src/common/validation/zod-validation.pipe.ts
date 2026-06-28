import type { PipeTransform } from "@nestjs/common";
import type { ZodSchema } from "zod";
import { AppError } from "../errors/app-error";

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", "Invalid request payload.", 400);
    }
    return parsed.data;
  }
}
