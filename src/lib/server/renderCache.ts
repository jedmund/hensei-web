/**
 * S3-backed cache for rendered PNGs.
 *
 * The Rails API owns the AWS bucket — SvelteKit reads/writes the same bucket
 * directly under a `previews/` prefix using its own credentials. og:image
 * URLs are version-stamped against the source record's `updated_at`, so
 * cache invalidation comes for free: as soon as the record changes, the URL
 * changes, and the new URL misses the cache and generates a fresh PNG.
 */

import {
	GetObjectCommand,
	NotFound,
	PutObjectCommand,
	S3Client,
	type S3ClientConfig
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '$env/dynamic/private'

let cachedClient: S3Client | null = null

function getConfig(): { bucket: string; client: S3Client } {
	const bucket = env.RENDER_S3_BUCKET
	if (!bucket) {
		throw new Error('RENDER_S3_BUCKET is not set. Configure the bucket to enable cached renders.')
	}
	if (!cachedClient) {
		const region = env.RENDER_S3_REGION ?? env.AWS_REGION ?? 'us-east-1'
		const config: S3ClientConfig = { region }
		const accessKeyId = env.RENDER_S3_ACCESS_KEY_ID ?? env.AWS_ACCESS_KEY_ID
		const secretAccessKey = env.RENDER_S3_SECRET_ACCESS_KEY ?? env.AWS_SECRET_ACCESS_KEY
		if (accessKeyId && secretAccessKey) {
			config.credentials = { accessKeyId, secretAccessKey }
		}
		// If credentials aren't passed explicitly, the SDK will fall back to
		// the default credential chain (env, instance metadata, ~/.aws/...).
		cachedClient = new S3Client(config)
	}
	return { bucket, client: cachedClient }
}

/**
 * Reset the cached client. Call from test setup / teardown — never in prod.
 */
export function _resetCacheClientForTests(): void {
	cachedClient = null
}

/**
 * Stream a cached PNG into memory. Returns `null` on a cache miss. Any other
 * S3 error (auth, network, bucket missing) propagates so the caller can decide
 * whether to fall back to a fresh render or hard-fail.
 */
export async function getCachedRender(key: string): Promise<Buffer | null> {
	const { bucket, client } = getConfig()
	try {
		const resp = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
		const body = resp.Body
		if (!body) return null
		// AWS SDK v3 returns a node stream on Node. transformToByteArray() is
		// the SDK's officially-blessed helper that buffers it for us.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const bytes = await (body as any).transformToByteArray()
		return Buffer.from(bytes)
	} catch (err) {
		if (err instanceof NotFound) return null
		// Some S3-compatible stores return a generic 404 instead of NotFound.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const code = (err as any)?.$metadata?.httpStatusCode
		if (code === 404) return null
		throw err
	}
}

/** Upload a freshly-rendered PNG. Overwrites any existing object at `key`. */
export async function putRender(key: string, body: Buffer): Promise<void> {
	const { bucket, client } = getConfig()
	await client.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: body,
			ContentType: 'image/png',
			// Long-lived cache: the version stamp in the URL is the invalidation
			// signal, so once a (template, id, version) tuple is rendered it is
			// immutable.
			CacheControl: 'public, max-age=31536000, immutable',
			ACL: 'private'
		})
	)
}

/**
 * Pre-signed GET URL. Used when we'd rather 302 to S3 than stream the PNG
 * through the SvelteKit process.
 */
export async function presignRenderUrl(key: string, expiresIn = 3600): Promise<string> {
	const { bucket, client } = getConfig()
	return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn })
}
