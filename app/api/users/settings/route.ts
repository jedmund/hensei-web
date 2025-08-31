import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { putToApi } from '~/app/lib/api-utils'

// Settings update schema
const SettingsSchema = z.object({
  picture: z.string().optional(),
  gender: z.enum(['gran', 'djeeta']).optional(),
  language: z.enum(['en', 'ja']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  bahamut: z.boolean().optional()
})

export async function PUT(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = SettingsSchema.parse(body)
    
    // Get user info from cookie
    const cookieStore = cookies()
    const accountCookie = cookieStore.get('account')
    
    if (!accountCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Parse account cookie
    const accountData = JSON.parse(accountCookie.value)
    
    // Call API to update settings
    const response = await putToApi(`/users/${accountData.userId}`, {
      user: validatedData
    })
    
    // Update user cookie with new settings
    const userCookie = cookieStore.get('user')
    if (userCookie) {
      const userData = JSON.parse(userCookie.value)
      
      // Update user data
      const updatedUserData = {
        ...userData,
        avatar: {
          ...userData.avatar,
          picture: validatedData.picture || userData.avatar.picture
        },
        gender: validatedData.gender || userData.gender,
        language: validatedData.language || userData.language,
        theme: validatedData.theme || userData.theme,
        bahamut: validatedData.bahamut !== undefined ? validatedData.bahamut : userData.bahamut
      }
      
      // Set updated cookie
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 60)
      
      cookieStore.set('user', JSON.stringify(updatedUserData), {
        expires: expiresAt,
        path: '/',
        httpOnly: true,
        sameSite: 'strict'
      })
    }
    
    // Return updated user info
    return NextResponse.json({
      success: true,
      user: response
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}