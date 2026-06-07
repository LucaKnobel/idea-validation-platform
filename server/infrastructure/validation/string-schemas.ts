import * as z from 'zod'

/**
 * Builds a nullable string schema that trims input, enforces max length, and normalizes empty values to null.
 */
export const createNullableTrimmedStringSchema = (maxLength: number, tooLongMessage: string) => z.string()
  .trim()
  .max(maxLength, tooLongMessage)
  .nullable()
  .transform(value => value && value.length > 0 ? value : null)
