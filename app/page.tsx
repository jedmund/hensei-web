import { redirect } from 'next/navigation'

export default function HomePage() {
  // In the App Router, we can use redirect directly in a Server Component
  redirect('/new')
}