// src/services/googleApi.js - Updated to use Google Identity Services (GIS)

let tokenClient = null;
let accessToken = null;

export const initGoogleApi = (apiKey, clientId) =>
  new Promise((resolve, reject) => {
    // Load GAPI client for Drive/Sheets
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey,
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            'https://sheets.googleapis.com/$discovery/rest?version=v4',
          ],
        });

        // Init Google Identity Services token client
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly',
          callback: (resp) => {
            if (resp.error) return;
            accessToken = resp.access_token;
          },
        });

        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  });

export const signIn = () =>
  new Promise((resolve, reject) => {
    if (!tokenClient) return reject(new Error('Not initialized'));
    tokenClient.callback = (resp) => {
      if (resp.error) return reject(resp);
      accessToken = resp.access_token;
      resolve(resp);
    };
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });

export const signOut = () =>
  new Promise((resolve) => {
    if (accessToken) {
      window.google.accounts.oauth2.revoke(accessToken, () => {
        accessToken = null;
        window.gapi.client.setToken(null);
        resolve();
      });
    } else {
      resolve();
    }
  });

export const isSignedIn = () => !!accessToken;

export const listSpreadsheets = async () => {
  const res = await window.gapi.client.drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
    fields: 'files(id,name,modifiedTime)',
    orderBy: 'modifiedTime desc',
    pageSize: 50,
  });
  return res.result.files || [];
};

export const getSheetNames = async (fileId) => {
  const res = await window.gapi.client.sheets.spreadsheets.get({
    spreadsheetId: fileId,
    fields: 'sheets.properties',
  });
  return (res.result.sheets || []).map(s => s.properties.title);
};

export const getSheetData = async (fileId, sheetName) => {
  const res = await window.gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: fileId,
    range: sheetName,
  });
  const rows = res.result.values || [];
  if (rows.length < 2) return { headers: [], rows: [] };
  const headers = rows[0].map(h => h || '');
  const dataRows = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ''; });
    return obj;
  });
  return { headers, rows: dataRows };
};

export const loadAllSheetsForFile = async (file) => {
  const sheetNames = await getSheetNames(file.id);
  const sheets = await Promise.all(
    sheetNames.map(async name => {
      const data = await getSheetData(file.id, name);
      return { sheetName: name, ...data };
    })
  );
  return { fileId: file.id, fileName: file.name, sheets };
};
