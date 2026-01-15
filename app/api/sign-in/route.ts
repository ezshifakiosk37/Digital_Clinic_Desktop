import { db } from "@/app/_utils/db";
import { users } from "@/app/_utils/db/schema";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { username, password } = await request.json();

    // 1. Find user in Postgres using Drizzle
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (!user) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 2. Direct comparison (Plain Text)
    // WARNING: This is insecure for production use
    if (password !== user.password) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 3. Create Session Token (JWT)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ userId: user.id, username: user.username })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .sign(secret);

    // 4. Set HttpOnly Cookie
    const cookieStore = await cookies();
    cookieStore.set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365 * 10,
    });

    return NextResponse.json({ success: true });
}