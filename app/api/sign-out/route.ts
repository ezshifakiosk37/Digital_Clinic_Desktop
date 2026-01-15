import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  
  // Overwrite the cookie with an empty value and an expiration of 0
  cookieStore.set("session", "", {
    httpOnly: true,
    expires: new Date(0), // Sets expiration to the year 1970
    path: "/",
  });

  return NextResponse.json({ success: true, message: "Logged out" });
}