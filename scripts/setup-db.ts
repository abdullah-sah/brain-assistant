/**
 * Database setup script
 * Run this once after setting up your .env.local file
 * Usage: npx tsx scripts/setup-db.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
	console.error('❌ Missing Supabase credentials in environment variables.');
	console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) are set.');
	process.exit(1);
}

// Use service role key if available, otherwise anon key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
	console.log('🚀 Setting up database tables...\n');

	try {
		// Read the schema SQL file
		const schemaPath = join(process.cwd(), 'supabase', 'schema.sql');
		const schemaSQL = readFileSync(schemaPath, 'utf-8');

		// Split by semicolons and execute each statement
		const statements = schemaSQL
			.split(';')
			.map((s) => s.trim())
			.filter((s) => s.length > 0 && !s.startsWith('--'));

		for (const statement of statements) {
			if (statement.trim()) {
				const { error } = await supabase.rpc('exec_sql', { sql: statement });
				if (error) {
					// Try direct query if RPC doesn't work
					const { error: queryError } = await supabase.from('_temp').select('1').limit(0);
					if (queryError && !queryError.message.includes('relation "_temp" does not exist')) {
						console.error('⚠️  Note: Some operations may require running SQL directly in Supabase dashboard.');
						console.error('   Please copy the contents of supabase/schema.sql to the SQL Editor.');
					}
				}
			}
		}

		console.log('✅ Database setup instructions:');
		console.log('   1. Go to your Supabase dashboard → SQL Editor');
		console.log('   2. Copy and paste the contents of supabase/schema.sql');
		console.log('   3. Click Run to execute\n');

		// Verify tables exist
		const { data: notes, error: notesError } = await supabase
			.from('notes')
			.select('id')
			.limit(1);

		const { data: tasks, error: tasksError } = await supabase
			.from('tasks')
			.select('id')
			.limit(1);

		if (!notesError && !tasksError) {
			console.log('✅ Tables verified successfully!');
			console.log('   - notes table: ✓');
			console.log('   - tasks table: ✓\n');
		} else {
			console.log('⚠️  Tables not yet created. Please run the SQL schema manually.');
		}
	} catch (error) {
		console.error('❌ Error setting up database:', error);
		console.log('\n📝 Manual setup required:');
		console.log('   1. Go to Supabase dashboard → SQL Editor');
		console.log('   2. Copy contents from supabase/schema.sql');
		console.log('   3. Run the SQL statements\n');
	}
}

setupDatabase();
