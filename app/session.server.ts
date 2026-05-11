import { createCookieSessionStorage, redirect } from "@remix-run/node";
import bcryptjs from "bcryptjs";
import { prisma } from "./db.server";

const sessionSecret = process.env.SESSION_SECRET || "orderflow-dev-secret-change-in-prod";

const storage = createCookieSessionStorage({
  cookie: {
    name: "orderflow_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
  },
});

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await storage.commitSession(session) },
  });
}

export async function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request): Promise<string | null> {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

export async function requireUserId(request: Request, redirectTo: string = "/login") {
  const userId = await getUserId(request);
  if (!userId) throw redirect(redirectTo);
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } });
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/login", {
    headers: { "Set-Cookie": await storage.destroySession(session) },
  });
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const valid = await bcryptjs.compare(password, user.password);
  if (!valid) return null;
  return user;
}

export async function register(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "此 Email 已註冊" };
  const hashed = await bcryptjs.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, name },
  });
  return { user };
}
