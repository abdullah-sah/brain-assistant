'use client';

import { createClient } from '@/app/utils/supabase/client';

export default function LoginPage() {
	const supabase = createClient();

	const handleGitHubLogin = async () => {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'github',
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
			},
		});

		if (error) {
			console.error('Error logging in:', error);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
			<div className="w-full max-w-md space-y-8 px-4">
				{/* Header */}
				<div className="text-center">
					<h1 className="text-[32px] font-semibold leading-tight tracking-tight text-[#fafafa]">
						Brain Assistant
					</h1>
					<p className="mt-2 text-[15px] leading-relaxed text-[#a1a1a1]">
						A memory prosthetic for commitments made in conversation.
					</p>
				</div>

				{/* Login Card */}
				<div className="rounded-lg border border-[#262626] bg-[#151515] p-8">
					<div className="space-y-6">
						<div className="space-y-2 text-center">
							<h2 className="text-[20px] font-medium text-[#fafafa]">Sign in to continue</h2>
							<p className="text-[13px] text-[#737373]">
								Use your GitHub account to access Brain
							</p>
						</div>

						<button
							onClick={handleGitHubLogin}
							className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#333333] bg-[#0a0a0a] px-4 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#111111] hover:border-[#404040]"
						>
							<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									fillRule="evenodd"
									d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
									clipRule="evenodd"
								/>
							</svg>
							Continue with GitHub
						</button>

						<p className="text-center text-[11px] text-[#525252]">
							By signing in, you agree to use Brain for personal productivity.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
