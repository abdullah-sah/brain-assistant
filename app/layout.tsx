import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';

const roboto = Roboto({
	weight: ['400', '500', '700'],
	variable: '--font-roboto',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Brain Assistant',
	description:
		'Personal assistant that turns any message or document into clear tasks and deadlines in one place.',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<body className={`${roboto.variable} antialiased`}>{children}</body>
		</html>
	);
}
