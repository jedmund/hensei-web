import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { postToApi } from '~/app/lib/api-utils'

// Signup request schema
const SignupSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string()
}).refine(data => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation']
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = SignupSchema.parse(body)
    
    // Call signup endpoint
    const response = await postToApi('/users', {
      user: {
        username: validatedData.username,
        email: validatedData.email,
        password: validatedData.password,
        password_confirmation: validatedData.password_confirmation
      }
    })
    
    // Return created user info
    return NextResponse.json({
      success: true,
      user: {
        username: response.username,
        email: response.email
      }
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    // Handle specific API errors
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any
      if (axiosError.response?.data?.error) {
        const apiError = axiosError.response.data.error
        
        // Username or email already in use
        if (apiError.includes('username') || apiError.includes('email')) {
          return NextResponse.json(
            { error: apiError },
            { status: 409 } // Conflict
          )
        }
      }
    }
    
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Signup failed' },
      { status: 500 }
    )
  }
}