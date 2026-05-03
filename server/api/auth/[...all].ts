import { auth } from '@infrastructure/services/auth'

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event))
})
