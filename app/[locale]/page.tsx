import { redirect } from 'next/navigation'

// Force dynamic rendering because redirect needs dynamic context
export const dynamic = 'force-dynamic'

export default function HomePage() {
  // In the App Router, we can use redirect directly in a Server Component
  redirect('/new')
}