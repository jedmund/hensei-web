'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { ToastProvider } from '@radix-ui/react-toast'
import { TooltipProvider } from '@radix-ui/react-tooltip'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider swipeDirection="right">
        <TooltipProvider>{children}</TooltipProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}