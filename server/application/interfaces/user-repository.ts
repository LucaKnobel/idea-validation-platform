export interface UserRepository {
  /**
   * Deletes one user by id and returns whether a row was removed.
   */
  deleteById(userId: string): Promise<boolean>
}
