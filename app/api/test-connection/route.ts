import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/app/utils/supabase/server';

export async function GET() {
	try {
		const cookieStore = cookies();
		const supabase = createClient(cookieStore);

		// Test connection by querying a table
		const { data, error } = await supabase
			.from('notes')
			.select('id')
			.limit(1);

		if (error) {
			// If table doesn't exist, that's expected - tables need to be created
			if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
				return NextResponse.json(
					{
						connected: true,
						tablesCreated: false,
						message: 'Connected to Supabase, but tables need to be created. Run the SQL schema in Supabase dashboard.',
					},
					{ status: 200 }
				);
			}

			return NextResponse.json(
				{
					connected: false,
					error: error.message,
				},
				{ status: 500 }
			);
		}

		return NextResponse.json({
			connected: true,
			tablesCreated: true,
			message: 'Successfully connected to Supabase with tables created!',
		});
	} catch (error) {
		return NextResponse.json(
			{
				connected: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
