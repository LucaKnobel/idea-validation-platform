import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildDeleteAccount } from '@application/services/build-delete-account'
import { UserNotFoundError } from '@application/errors/user-errors'
import type { UserRepository } from '@application/interfaces/user-repository'
import type { Logger } from '@interfaces/logger'
import { makeLogger, VALID_USER_ID } from './helpers'

describe('buildDeleteAccount', () => {
  let userRepository: UserRepository
  let logger: Logger
  let deleteAccount: ReturnType<typeof buildDeleteAccount>

  beforeEach(() => {
    userRepository = {
      deleteById: vi.fn()
    }

    logger = makeLogger()
    deleteAccount = buildDeleteAccount(userRepository, logger)
    vi.mocked(userRepository.deleteById).mockResolvedValue(true)
  })

  it('calls repository deletion with the authenticated user id', async () => {
    await deleteAccount({ userId: VALID_USER_ID })

    expect(userRepository.deleteById).toHaveBeenCalledWith(VALID_USER_ID)
  })

  it('resolves without a return value on success', async () => {
    const result = await deleteAccount({ userId: VALID_USER_ID })

    expect(result).toBeUndefined()
  })

  it('logs account deletion when successful', async () => {
    await deleteAccount({ userId: VALID_USER_ID })

    expect(logger.debug).toHaveBeenCalledWith('Account deleted', { userId: VALID_USER_ID })
  })

  it('throws UserNotFoundError when repository returns false', async () => {
    vi.mocked(userRepository.deleteById).mockResolvedValue(false)

    await expect(
      deleteAccount({ userId: VALID_USER_ID })
    ).rejects.toThrow(UserNotFoundError)
  })

  it('does not log deletion when account was not found', async () => {
    vi.mocked(userRepository.deleteById).mockResolvedValue(false)

    await expect(deleteAccount({ userId: VALID_USER_ID })).rejects.toThrow()

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
