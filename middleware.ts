import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

	// Create Supabase client with cookie handling
	let supabaseResponse = NextResponse.next({
		request: {
			headers: request.headers,
		},
	});

	const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
				supabaseResponse = NextResponse.next({
					request,
				});
				cookiesToSet.forEach(({ name, value, options }) =>
					supabaseResponse.cookies.set(name, value, options)
				);
			},
		},
	});

	// Get the current path
	const path = request.nextUrl.pathname;

	// Public paths that don't require authentication
	const publicPaths = ['/login', '/auth/callback'];
	const isPublicPath = publicPaths.some((publicPath) => path.startsWith(publicPath));

	// If it's a public path, allow access
	if (isPublicPath) {
		return supabaseResponse;
	}

	// Check if user is authenticated
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// If not authenticated, redirect to login
	if (!user) {
		const redirectUrl = request.nextUrl.clone();
		redirectUrl.pathname = '/login';
		return NextResponse.redirect(redirectUrl);
	}

	// User is authenticated, allow access
	return supabaseResponse;
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		'/((?!_next/static|_next/image|favicon.ico).*)',
	],
};
