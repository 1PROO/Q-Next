import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/admin(.*)"]);

// In Next.js 16.x (this version), middleware is renamed to proxy
export const proxy = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
    
    // Admin redirection logic
    const { userId } = await auth();
    const isAdmin = userId === process.env.ADMIN_USER_ID;
    const isDashboardPath = req.nextUrl.pathname.startsWith('/dashboard');
    
    if (isAdmin && isDashboardPath) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
