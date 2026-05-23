export { default } from "next-auth/middleware";

export const config = {
  // Protect everything except: static assets, NextAuth API routes, the login page, and the public folder.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|logo.png|login).*)"],
};
