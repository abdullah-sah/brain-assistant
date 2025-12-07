import * as chrono from 'chrono-node';

/**
 * Parses a natural language date string into a Date object
 * Handles various formats like "tomorrow", "next Friday", "2025-12-15", etc.
 *
 * @param dateString - The raw date string to parse (e.g., "tomorrow", "next Monday", "15th December")
 * @returns Date object if successfully parsed, null otherwise
 *
 * @example
 * parseDate("tomorrow") // Returns tomorrow's date
 * parseDate("next Friday") // Returns the date of next Friday
 * parseDate("2025-12-15") // Returns December 15, 2025
 * parseDate(null) // Returns null
 * parseDate("invalid") // Returns null
 */
export function parseDate(dateString: string | null): Date | null {
	// Return null for empty/null inputs
	if (!dateString || dateString.trim() === '') {
		return null;
	}

	try {
		// Use chrono to parse the natural language date
		// referenceDate is set to now to properly handle relative dates like "tomorrow"
		const parsed = chrono.parseDate(dateString, new Date());

		// chrono.parseDate returns null if it can't parse the string
		if (!parsed) {
			console.warn(`Could not parse date: "${dateString}"`);
			return null;
		}

		// Validate that the parsed date is reasonable (not too far in the past)
		// Allow dates from 1 year ago to 10 years in the future
		const oneYearAgo = new Date();
		oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

		const tenYearsFromNow = new Date();
		tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);

		if (parsed < oneYearAgo || parsed > tenYearsFromNow) {
			console.warn(`Parsed date out of reasonable range: "${dateString}" -> ${parsed.toISOString()}`);
			// Still return the date, but log the warning
		}

		return parsed;
	} catch (error) {
		console.error(`Error parsing date "${dateString}":`, error);
		return null;
	}
}

/**
 * Formats a Date object into a YYYY-MM-DD string for database storage
 * @param date - The Date object to format
 * @returns YYYY-MM-DD string or null if input is null
 */
export function formatDateForDB(date: Date | null): string | null {
	if (!date) {
		return null;
	}

	// Format as YYYY-MM-DD
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
}
