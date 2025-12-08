import mammoth from 'mammoth';
import sharp from 'sharp';
import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Parse a document buffer and extract text based on MIME type
 * @param buffer - File buffer to parse
 * @param mimeType - MIME type of the file
 * @returns Object with extracted text or error message
 */
export async function parseDocument(
	buffer: Buffer,
	mimeType: string
): Promise<{ text: string; error?: string }> {
	try {
		switch (mimeType) {
			case 'application/pdf':
				return await parsePDF(buffer);
			case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
				return await parseDOCX(buffer);
			case 'image/jpeg':
			case 'image/jpg':
			case 'image/png':
			case 'image/heic':
				return await parseImage(buffer);
			case 'text/plain':
			case 'text/markdown':
				return await parseText(buffer);
			default:
				return {
					text: '',
					error: `Unsupported file type: ${mimeType}`,
				};
		}
	} catch (error) {
		console.error('Error in parseDocument:', error);
		return {
			text: '',
			error: error instanceof Error ? error.message : 'Unknown parsing error',
		};
	}
}

/**
 * Parse PDF document and extract text
 */
async function parsePDF(buffer: Buffer): Promise<{ text: string; error?: string }> {
	try {
		// Dynamic import to avoid build-time issues with pdf-parse dependencies
		const pdfParseModule = await import('pdf-parse');
		// pdf-parse exports itself as the module, not as default
		const pdfParse = (pdfParseModule as any) as (buffer: Buffer) => Promise<{ text: string }>;
		const data = await pdfParse(buffer);
		const text = data.text.trim();

		// Check if PDF has meaningful text content
		if (text.length < 50) {
			return {
				text: '',
				error: 'PDF appears to be scanned or contains minimal text. Try uploading as image for better OCR.',
			};
		}

		return { text };
	} catch (error) {
		console.error('Error parsing PDF:', error);
		return {
			text: '',
			error: 'Could not read PDF. The file may be corrupted or password-protected.',
		};
	}
}

/**
 * Parse DOCX document and extract text
 */
async function parseDOCX(buffer: Buffer): Promise<{ text: string; error?: string }> {
	try {
		const result = await mammoth.extractRawText({ buffer });
		const text = result.value.trim();

		if (!text) {
			return {
				text: '',
				error: 'No text found in Word document. The file may be empty or corrupted.',
			};
		}

		return { text };
	} catch (error) {
		console.error('Error parsing DOCX:', error);
		return {
			text: '',
			error: 'Could not read Word document. Try converting to PDF or plain text.',
		};
	}
}

/**
 * Parse image using GPT-4 Vision API for OCR
 */
async function parseImage(buffer: Buffer): Promise<{ text: string; error?: string }> {
	try {
		// Preprocess image: resize to max 2000px width for cost optimization
		const processedBuffer = await sharp(buffer)
			.resize(2000, null, {
				withoutEnlargement: true,
				fit: 'inside',
			})
			.jpeg({ quality: 90 })
			.toBuffer();

		// Convert buffer to base64
		const base64Image = processedBuffer.toString('base64');

		// Call GPT-4 Vision API
		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: 'Extract all text from this image. Preserve the original formatting and structure as much as possible. If the image contains handwritten text, transcribe it accurately. Return only the extracted text without any additional commentary.',
						},
						{
							type: 'image_url',
							image_url: {
								url: `data:image/jpeg;base64,${base64Image}`,
							},
						},
					],
				},
			],
			max_tokens: 4096,
		});

		const text = response.choices[0]?.message?.content?.trim() || '';

		if (!text) {
			return {
				text: '',
				error: 'Could not extract text from image. Please paste text manually or try a clearer image.',
			};
		}

		return { text };
	} catch (error) {
		console.error('Error parsing image with OCR:', error);
		return {
			text: '',
			error: 'Image OCR failed. Please paste text manually or try a different image.',
		};
	}
}

/**
 * Parse plain text file
 */
async function parseText(buffer: Buffer): Promise<{ text: string; error?: string }> {
	try {
		const text = buffer.toString('utf-8').trim();

		if (!text) {
			return {
				text: '',
				error: 'Text file is empty.',
			};
		}

		return { text };
	} catch (error) {
		console.error('Error parsing text file:', error);
		return {
			text: '',
			error: 'Could not read text file. File may be corrupted or use unsupported encoding.',
		};
	}
}
