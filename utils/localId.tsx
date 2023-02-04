import { accountCookie } from './userToken'

export function getLocalId() {
  const cookie = accountCookie()
  const parsed = JSON.parse(cookie as string)
  if (parsed && !parsed.token) {
    return { local_id: parsed.userId }
  } else return {}
}
