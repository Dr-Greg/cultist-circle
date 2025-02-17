import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();

  // Get all cookie names
  const cookieNames = cookieStore.getAll().map((cookie) => cookie.name);

  // Expire all cookies
  cookieNames.forEach((name) => {
    cookieStore.set(name, "", { maxAge: 0 });
  });

  return NextResponse.json({ message: "All cookies cleared" });
}
