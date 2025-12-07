import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/app/utils/supabase/server';

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get('code');
	const origin = requestUrl.origin;

	if (code) {
		const cookieStore = cookies();
		const supabase = createClient(cookieStore);

		// Exchange the code for a session
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (error) {
			console.error('Error exchanging code for session:', error);
			// Redirect to login with error
			return NextResponse.redirect(`${origin}/login?error=auth_failed`);
		}
	}

	// Successful login - redirect to home
	return NextResponse.redirect(`${origin}/`);
}
