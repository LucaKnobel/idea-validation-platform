import { auth } from '@infrastructure/auth/auth'

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event))
})
