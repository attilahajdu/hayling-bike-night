import { NextResponse } from "next/server";
import {
  COMMUNITY_UPLOAD_MAX_BYTES_PER_FILE,
  COMMUNITY_UPLOAD_MAX_FILES,
  COMMUNITY_UPLOAD_MAX_TOTAL_BYTES,
} from "@/lib/community-upload-config";
import { isSupabaseStorageConfigured } from "@/lib/supabase-storage";

function directUploadAvailable(): boolean {
  if (!isSupabaseStorageConfigured()) return false;
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

export async function GET() {
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || process.env.SUPABASE_STORAGE_BUCKET?.trim() || "uploads";
  return NextResponse.json({
    directUpload: directUploadAvailable(),
    bucket,
    maxFiles: COMMUNITY_UPLOAD_MAX_FILES,
    maxBytesPerFile: COMMUNITY_UPLOAD_MAX_BYTES_PER_FILE,
    maxTotalBytes: COMMUNITY_UPLOAD_MAX_TOTAL_BYTES,
  });
}
