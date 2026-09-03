/**
 * Append rows to Google Sheet via service account (Node runtime).
 */
import { createSign } from "crypto";
import { SHEET_HEADER_LABELS } from "./csv";
import { buildMapsUrl } from "./maps";

const DEFAULT_SHEET_ID = "1D0pRC_NEuG9HJK8hVVxedlIUWNU3UjLhohahYS9akGM";

function getCredentials() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
  let key = process.env.GOOGLE_PRIVATE_KEY || "";
  key = key.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID;
  return { email, key, sheetId };
}

export function isSheetsConfigured() {
  const { email, key } = getCredentials();
  return Boolean(email && key.includes("PRIVATE KEY"));
}

export function getDefaultSheetId() {
  return process.env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID;
}

function base64url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getAccessToken(email: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${claim}`;
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  sign.end();
  const signature = sign
    .sign(privateKey)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Google auth failed: ${res.status} ${t}`);
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

function rowToSheetValues(b: Record<string, unknown>): string[] {
  const maps =
    (b.mapsUrl as string) ||
    buildMapsUrl({
      companyName: b.companyName as string,
      principalAddress: b.principalAddress as string,
      city: b.city as string,
      state: b.state as string,
      zip: b.zip as string,
    });

  return [
    String(b.companyName ?? ""),
    String(b.state ?? ""),
    String(b.entityType ?? ""),
    String(b.entityNumber ?? ""),
    String(b.status ?? ""),
    String(b.formationDate ?? ""),
    String(b.principalAddress ?? ""),
    String(b.city ?? ""),
    String(b.zip ?? ""),
    String(b.registeredAgent ?? ""),
    String(b.website ?? ""),
    String(b.businessEmail ?? ""),
    String(b.businessPhone ?? ""),
    String(b.trademarkStatus ?? ""),
    String(b.trademarkMatch ?? ""),
    String(b.source ?? ""),
    String(b.sourceUrl ?? ""),
    String(b.lastChecked ?? ""),
    String(b.recordId ?? b.id ?? ""),
    maps,
  ];
}

export async function ensureHeaderRow(accessToken: string, sheetId: string) {
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:T1`;
  const getRes = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (getRes.ok) {
    const data = (await getRes.json()) as { values?: string[][] };
    if (data.values?.[0]?.length) return;
  }

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:T1?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [SHEET_HEADER_LABELS] }),
    }
  );
}

export async function appendBusinessesToSheet(
  businesses: Record<string, unknown>[]
): Promise<{ appended: number; sheetId: string }> {
  const { email, key, sheetId } = getCredentials();
  if (!email || !key) {
    throw new Error(
      "Google Sheets not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY."
    );
  }

  const token = await getAccessToken(email, key);
  await ensureHeaderRow(token, sheetId);

  const values = businesses.map(rowToSheetValues);
  let appended = 0;

  for (let i = 0; i < values.length; i += 500) {
    const chunk = values.slice(i, i + 500);
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:T:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: chunk }),
      }
    );
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Sheets append failed: ${res.status} ${t}`);
    }
    appended += chunk.length;
  }

  return { appended, sheetId };
}
