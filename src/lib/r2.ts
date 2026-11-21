import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucketName = process.env.R2_BUCKET_NAME || 'siwarga-receipts'

let s3Client: S3Client | null = null

if (accountId && accessKeyId && secretAccessKey) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

export async function generatePresignedPut(
  key: string,
  contentType: string
): Promise<{ uploadUrl: string; fileKey: string }> {
  const fileKey = `receipts/${Date.now()}-${key}`

  if (!s3Client) {
    // Local / development mock presigned URL
    return {
      uploadUrl: `/api/v1/uploads/mock-upload?key=${fileKey}`,
      fileKey,
    }
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 })
  return { uploadUrl, fileKey }
}

export async function generatePresignedGet(
  fileKey: string,
  expiresIn = 300
): Promise<string> {
  if (!s3Client) {
    return `/api/v1/uploads/mock-view?key=${fileKey}`
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}
