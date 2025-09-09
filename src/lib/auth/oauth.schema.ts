import { z } from 'zod'

export const OAuthLoginResponseSchema = z.object({
	access_token: z.string(),
	token_type: z.literal('Bearer'),
	expires_in: z.number().int().positive(),
	refresh_token: z.string(),
	created_at: z.number().int().nonnegative(),
	user: z.object({
		id: z.string(),
		username: z.string(),
		role: z.number().int()
	})
})

export type OAuthLoginResponse = z.infer<typeof OAuthLoginResponseSchema>
