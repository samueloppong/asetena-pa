import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

export function getS3Client() {
  return new S3Client({
    region: process.env.MINIO_REGION || "us-east-1",
    endpoint: required("MINIO_ENDPOINT"),
    forcePathStyle: true,
    credentials: {
      accessKeyId: required("MINIO_ROOT_USER"),
      secretAccessKey: required("MINIO_ROOT_PASSWORD"),
    },
  });
}

export function getBucket() {
  return process.env.MINIO_BUCKET || "sheltergh-media";
}

export function getPublicUrl(key: string) {
  // Same-origin proxy — works on desktop and phones via LAN IP
  return `/api/v1/media/${key}`;
}

export async function ensureBucket() {
  const client = getS3Client();
  const bucket = getBucket();
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    };
    await client.send(
      new PutBucketPolicyCommand({
        Bucket: bucket,
        Policy: JSON.stringify(policy),
      })
    );
  }
}

function localRoot() {
  return path.resolve(process.cwd(), "storage", "uploads");
}

function localFile(key: string) {
  const root = localRoot();
  const full = path.resolve(root, key);
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error("Invalid media key");
  }
  return full;
}

async function writeLocalObject(key: string, file: Buffer, contentType: string) {
  const full = localFile(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, file);
  await writeFile(`${full}.type`, contentType);
}

export async function readLocalObject(key: string) {
  try {
    const full = localFile(key);
    const bytes = await readFile(full);
    let contentType = "application/octet-stream";
    try {
      contentType = (await readFile(`${full}.type`, "utf8")).trim();
    } catch {
      // Type sidecar is optional for older files.
    }
    return { bytes, contentType };
  } catch {
    return null;
  }
}

export async function uploadObject(
  file: Buffer,
  contentType: string,
  folder = "properties"
) {
  const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") || "bin";
  const key = `${folder}/${randomUUID()}.${ext}`;
  try {
    await ensureBucket();
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: getBucket(),
        Key: key,
        Body: file,
        ContentType: contentType,
      })
    );
  } catch (error) {
    console.error("MinIO upload failed, storing the file locally", error);
    await writeLocalObject(key, file, contentType);
  }
  return { key, url: getPublicUrl(key) };
}
