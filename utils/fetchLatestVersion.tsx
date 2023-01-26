import api from './api'

export default async function fetchLatestVersion() {
  try {
    const response = await api.version()
    return response.data as AppUpdate
  } catch (error) {
    console.error(error)
  }
}
