import { prisma } from '@infrastructure/db/prisma'
import type { UserRepository } from '@application/interfaces/user-repository'

export const userRepository: UserRepository = {
  /**
   * Deletes one user by id and returns whether a row was removed.
   */
  async deleteById(userId: string): Promise<boolean> {
    const result = await prisma.user.deleteMany({
      where: { id: userId }
    })

    return result.count > 0
  }
}
