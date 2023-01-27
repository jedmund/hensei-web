import { AxiosError } from 'axios'

function handleError(error: any) {
  if (error instanceof Error) return error.message
}

function handleAxiosError(error: any) {
  const axiosError = error as AxiosError
  return axiosError.response
}

export function printError(error: any, type?: string) {
  if (type === 'axios') {
    const response = handleAxiosError(error)
    console.log(`${response?.status} ${response?.statusText}`)
    console.log(response?.data)
  } else {
    console.log(handleError(error))
  }
}
