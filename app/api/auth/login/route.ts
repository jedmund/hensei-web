import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { login as loginHelper } from '~/app/lib/api-utils'

// Login request schema
const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = LoginSchema.parse(body)
    
    // Call login helper with credentials
    const response = await loginHelper(validatedData)
    
    // Set cookies based on response
    if (response.token) {
      // Calculate expiration (60 days)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 60)
      
      // Set account cookie with auth info
      const accountCookie = {
        userId: response.user_id,
        username: response.username,
        role: response.role,
        token: response.token
      }
      
      // Set user cookie with preferences/profile
      const userCookie = {
        avatar: {
          picture: response.avatar.picture,
          element: response.avatar.element
        },
        gender: response.gender,
        language: response.language,
        theme: response.theme,
        bahamut: response.bahamut || false
      }
      
      // Set cookies
      const cookieStore = cookies()
      cookieStore.set('account', JSON.stringify(accountCookie), {
        expires: expiresAt,
        path: '/',
        httpOnly: true,
        sameSite: 'strict'
      })
      
      cookieStore.set('user', JSON.stringify(userCookie), {
        expires: expiresAt,
        path: '/',
        httpOnly: true,
        sameSite: 'strict'
      })
      
      // Return success
      return NextResponse.json({
        success: true,
        user: {
          username: response.username,
          avatar: response.avatar
        }
      })
    }
    
    // If we get here, something went wrong
    return NextResponse.json(
      { error: 'Invalid login response' },
      { status: 500 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    // For authentication errors
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}