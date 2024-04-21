import { useState } from 'react'

export const usePaginationState = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [recordCount, setRecordCount] = useState(0)

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    recordCount,
    setRecordCount,
  }
}
