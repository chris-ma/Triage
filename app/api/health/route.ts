import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    nhostGraphqlUrl: !!process.env.NHOST_GRAPHQL_URL,
    nhostStorageUrl: !!process.env.NHOST_STORAGE_URL,
    nhostAdminSecret: !!process.env.NHOST_ADMIN_SECRET,
    deepseekKey: !!process.env.DEEPSEEK_API_KEY,
  });
}
