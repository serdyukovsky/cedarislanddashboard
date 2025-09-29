import { google } from "googleapis";

const SCOPES = [
	"https://www.googleapis.com/auth/spreadsheets.readonly",
	"https://www.googleapis.com/auth/drive.metadata.readonly"
];

function getJwtClient() {
	// Try GOOGLE_SERVICE_ACCOUNT_KEY first (JSON format)
	const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
	if (serviceAccountKey) {
		let credentials;
		try {
			credentials = JSON.parse(serviceAccountKey);
		} catch (error) {
			throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_KEY JSON format");
		}
		
		if (!credentials.client_email || !credentials.private_key) {
			throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY missing client_email or private_key");
		}
		
		return new google.auth.JWT({
			email: credentials.client_email,
			key: credentials.private_key.replace(/\\n/g, "\n"),
			scopes: SCOPES,
		});
	}
	
	// Fallback to separate environment variables
	const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
	const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
	
	if (!clientEmail || !privateKey) {
		throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SHEETS_CLIENT_EMAIL/GOOGLE_SHEETS_PRIVATE_KEY");
	}
	
	return new google.auth.JWT({
		email: clientEmail,
		key: privateKey.replace(/\\n/g, "\n"),
		scopes: SCOPES,
	});
}

export async function readSheetValues(sheetId: string, range: string) {
	const auth = getJwtClient();
	const sheets = google.sheets({ version: "v4", auth });
	const res = await sheets.spreadsheets.values.get({
		spreadsheetId: sheetId,
		range,
		valueRenderOption: "UNFORMATTED_VALUE",
		dateTimeRenderOption: "FORMATTED_STRING",
	});
	return res.data.values ?? [];
}

export async function getSheetMetadata(sheetId: string) {
	const auth = getJwtClient();
	const drive = google.drive({ version: "v3", auth });
	
	try {
		// Get file metadata including last modified time
		const fileRes = await drive.files.get({
			fileId: sheetId,
			fields: "modifiedTime,name",
		});
		
		return fileRes.data;
	} catch (error) {
		console.error("Error getting sheet metadata:", error);
		throw error;
	}
}
