interface GoogleSheetsConfig {
  spreadsheetId: string;
  serviceAccountEmail: string;
  privateKey: string;
}

async function getAccessToken(config: GoogleSheetsConfig): Promise<string> {
  console.log('🔑 Obteniendo token de acceso...');
  
  const jwt = await createJWT(config);
  console.log('📝 JWT creado, solicitando token...');
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Error obteniendo token:', errorText);
    throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ Token obtenido exitosamente');
  return data.access_token;
}

async function createJWT(config: GoogleSheetsConfig): Promise<string> {
  console.log('🔧 Creando JWT...');
  
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: config.serviceAccountEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  
  // Import the private key
  const privateKeyPem = config.privateKey;
  const privateKey = await importPrivateKey(privateKeyPem);
  
  // Sign the JWT
  const signature = await signJWT(signatureInput, privateKey);
  
  console.log('✅ JWT creado exitosamente');
  return `${signatureInput}.${signature}`;
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  console.log('🔐 Importando clave privada...');
  
  try {
    // Remove the PEM header/footer and whitespace
    const pemContents = pem
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');
    
    // Convert base64 to ArrayBuffer
    const binaryDer = atob(pemContents);
    const der = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i++) {
      der[i] = binaryDer.charCodeAt(i);
    }

    const key = await crypto.subtle.importKey(
      'pkcs8',
      der,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );
    
    console.log('✅ Clave privada importada exitosamente');
    return key;
  } catch (error) {
    console.error('❌ Error importando clave privada:', error);
    throw new Error(`Error importing private key: ${error}`);
  }
}

async function signJWT(data: string, privateKey: CryptoKey): Promise<string> {
  console.log('✍️ Firmando JWT...');
  
  try {
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      encoder.encode(data)
    );

    const signatureArray = new Uint8Array(signature);
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
    
    console.log('✅ JWT firmado exitosamente');
    return signatureBase64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  } catch (error) {
    console.error('❌ Error firmando JWT:', error);
    throw new Error(`Error signing JWT: ${error}`);
  }
}

export async function listGoogleSheetsTabs(): Promise<string[]> {
  try {
    console.log('📋 Obteniendo lista de hojas...');
    
    const config: GoogleSheetsConfig = {
      spreadsheetId: import.meta.env.VITE_GOOGLE_SHEET_ID,
      serviceAccountEmail: import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: import.meta.env.VITE_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''
    };

    // Validar configuración
    if (!config.spreadsheetId || !config.serviceAccountEmail || !config.privateKey) {
      throw new Error('Configuración de Google Sheets incompleta');
    }

    const accessToken = await getAccessToken(config);
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error obteniendo hojas:', errorData);
      throw new Error(`Error obteniendo hojas: ${errorData.error?.message || 'Error desconocido'}`);
    }

    const data = await response.json();
    const sheetNames = data.sheets.map((sheet: any) => sheet.properties.title);
    
    console.log('✅ Hojas obtenidas:', sheetNames);
    return sheetNames;
    
  } catch (error) {
    console.error('❌ Error listing sheets:', error);
    throw new Error(`Error al obtener lista de hojas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

export async function createGoogleSheetTab(sheetName: string): Promise<void> {
  try {
    console.log('📝 Creando nueva hoja:', sheetName);
    
    const config: GoogleSheetsConfig = {
      spreadsheetId: import.meta.env.VITE_GOOGLE_SHEET_ID,
      serviceAccountEmail: import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: import.meta.env.VITE_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''
    };

    // Validar configuración
    if (!config.spreadsheetId || !config.serviceAccountEmail || !config.privateKey) {
      throw new Error('Configuración de Google Sheets incompleta');
    }

    const accessToken = await getAccessToken(config);
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`;
    
    const requestBody = {
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName
            }
          }
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error creando hoja:', errorData);
      throw new Error(`Error creando hoja: ${errorData.error?.message || 'Error desconocido'}`);
    }

    console.log('✅ Hoja creada exitosamente:', sheetName);
    
    // Añadir encabezados a la nueva hoja
    await addHeadersToSheet(sheetName, config, accessToken);
    
  } catch (error) {
    console.error('❌ Error creating sheet:', error);
    throw new Error(`Error al crear hoja: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

async function addHeadersToSheet(sheetName: string, config: GoogleSheetsConfig, accessToken: string): Promise<void> {
  try {
    console.log('📋 Añadiendo encabezados a la hoja:', sheetName);
    
    const headers = [
      'Timestamp',
      'Duración (seg)',
      'Transcripción',
      'Estudiantes',
      'Categoría',
      'Sentimiento',
      'Resumen',
      'Acciones'
    ];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${sheetName}!A1:H1?valueInputOption=RAW`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [headers],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error añadiendo encabezados:', errorData);
      throw new Error(`Error añadiendo encabezados: ${errorData.error?.message || 'Error desconocido'}`);
    }

    console.log('✅ Encabezados añadidos exitosamente');
    
  } catch (error) {
    console.error('❌ Error adding headers:', error);
    throw new Error(`Error al añadir encabezados: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

export async function renameGoogleSheetTab(oldName: string, newName: string): Promise<void> {
  try {
    console.log('✏️ Renombrando hoja:', oldName, '→', newName);
    
    const config: GoogleSheetsConfig = {
      spreadsheetId: import.meta.env.VITE_GOOGLE_SHEET_ID,
      serviceAccountEmail: import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: import.meta.env.VITE_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''
    };

    // Validar configuración
    if (!config.spreadsheetId || !config.serviceAccountEmail || !config.privateKey) {
      throw new Error('Configuración de Google Sheets incompleta');
    }

    const accessToken = await getAccessToken(config);
    
    // Primero obtener el ID de la hoja
    const sheetsResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!sheetsResponse.ok) {
      throw new Error('Error obteniendo información de las hojas');
    }

    const sheetsData = await sheetsResponse.json();
    const sheet = sheetsData.sheets.find((s: any) => s.properties.title === oldName);
    
    if (!sheet) {
      throw new Error(`No se encontró la hoja "${oldName}"`);
    }

    const sheetId = sheet.properties.sheetId;
    
    // Renombrar la hoja
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`;
    
    const requestBody = {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId: sheetId,
              title: newName
            },
            fields: 'title'
          }
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error renombrando hoja:', errorData);
      throw new Error(`Error renombrando hoja: ${errorData.error?.message || 'Error desconocido'}`);
    }

    console.log('✅ Hoja renombrada exitosamente:', oldName, '→', newName);
    
  } catch (error) {
    console.error('❌ Error renaming sheet:', error);
    throw new Error(`Error al renombrar hoja: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

export async function appendToGoogleSheet(data: any[][] | any[], sheetName: string = 'Sheet1'): Promise<void> {
  try {
    console.log('📊 Iniciando envío a Google Sheets...');
    console.log('🎯 Hoja destino:', sheetName);
    
    // Normalizar datos - si es un array simple, convertirlo a array de arrays
    const normalizedData = Array.isArray(data[0]) ? data as any[][] : [data as any[]];
    console.log('📝 Datos normalizados:', normalizedData);
    
    const config: GoogleSheetsConfig = {
      spreadsheetId: import.meta.env.VITE_GOOGLE_SHEET_ID,
      serviceAccountEmail: import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: import.meta.env.VITE_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''
    };

    console.log('🔍 Configuración:', {
      spreadsheetId: config.spreadsheetId ? '✅ Configurado' : '❌ Faltante',
      serviceAccountEmail: config.serviceAccountEmail ? '✅ Configurado' : '❌ Faltante',
      privateKey: config.privateKey ? '✅ Configurado' : '❌ Faltante'
    });

    // Validar configuración
    if (!config.spreadsheetId || !config.serviceAccountEmail || !config.privateKey) {
      throw new Error('Configuración de Google Sheets incompleta. Revisa las variables de entorno.');
    }

    // Obtener token de acceso
    const accessToken = await getAccessToken(config);

    console.log('📝 Datos a enviar:', normalizedData);
    
    // Enviar datos a Google Sheets (hoja específica)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${sheetName}!A:H:append?valueInputOption=RAW`;
    console.log('🌐 URL de la API:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: normalizedData,
      }),
    });

    console.log('📡 Respuesta de la API:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error de Google Sheets API:', errorData);
      throw new Error(`Error de Google Sheets: ${errorData.error?.message || 'Error desconocido'}`);
    }

    const result = await response.json();
    console.log('✅ Datos enviados a Google Sheets exitosamente:', result);
    
  } catch (error) {
    console.error('❌ Error completo sending to Google Sheets:', error);
    throw new Error(`Error al enviar datos a Google Sheets: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}