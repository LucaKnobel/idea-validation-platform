import type { UserRepository } from '@application/interfaces/user-repository'
import type { Logger } from '@interfaces/logger'
import { UserNotFoundError } from '@application/errors/user-errors'

export type DeleteAccountInput = {
  userId: string
}

/**
 * Builds the use case that permanently deletes the authenticated account.
 */
export const buildDeleteAccount = (userRepository: UserRepository, logger: Logger) => {
  return async (input: DeleteAccountInput): Promise<void> => {
    const deleted = await userRepository.deleteById(input.userId)

    if (!deleted) {
      throw new UserNotFoundError()
    }

    logger.debug('Account deleted', { userId: input.userId })
  }
}
