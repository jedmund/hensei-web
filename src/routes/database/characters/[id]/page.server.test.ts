import { describe, it, expect, vi } from 'vitest'
import { actions } from './+page.server'
import { toEditData } from '$lib/features/database/characters/schema'

function makeEvent(edit: any, opts?: { status?: number }) {
  const form = new FormData()
  form.set('payload', JSON.stringify(edit))

  const request = { formData: async () => form } as unknown as Request
  const status = opts?.status ?? 200
  const fetch = vi.fn(async () => new Response('{}', { status }))
  const params = { id: '3040109000' } as any
  return { request, fetch, params } as any
}

describe('characters actions.save', () => {
  it('succeeds on valid payload', async () => {
    const edit = toEditData({ granblue_id: '3040109000' })
    const res: any = await actions.save!(makeEvent(edit))
    expect(res).toMatchObject({ success: true })
  })

  it('fails validation for bad payload', async () => {
    const edit = { ...toEditData({ granblue_id: 'x' }), granblue_id: '' }
    const res: any = await actions.save!(makeEvent(edit))
    expect(res.status).toBe(422)
    expect(res.data.message).toBe('Validation error')
  })

  it('handles backend error', async () => {
    const edit = toEditData({ granblue_id: '3040109000' })
    const res: any = await actions.save!(makeEvent(edit, { status: 500 }))
    expect(res.status).toBe(500)
  })
})

