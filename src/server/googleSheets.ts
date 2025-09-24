import { google } from "googleapis";

const SCOPES = [
	"https://www.googleapis.com/auth/spreadsheets.readonly",
	"https://www.googleapis.com/auth/drive.metadata.readonly"
];

function getJwtClient() {
	const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
	const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");
	if (!clientEmail || !privateKey) {
		throw new Error("Missing GOOGLE_SHEETS_CLIENT_EMAIL or GOOGLE_SHEETS_PRIVATE_KEY");
	}
	return new google.auth.JWT({
		email: clientEmail,
		key: privateKey,
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
