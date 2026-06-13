/**
 * Returns true when the error is a Prisma unique-constraint violation (P2002).
 */
export const isPrismaUniqueConstraintViolation = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false
  }

  return (error as { code?: string }).code === 'P2002'
}
