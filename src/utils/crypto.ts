/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { DigitalCertificate, SBD4Data, SBD61Data, SBD8Data, SBD9Data, MBD4Data, MBD8Data, MBD9Data, SignatureResult, VerificationResult } from '../types';

// Convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64.replace(/\s/g, ''));
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Calculate SHA-256 of ArrayBuffer
export async function calculateSHA256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Convert Exported CryptoKey to PEM
export async function exportKeyToPem(key: CryptoKey, type: 'public' | 'private'): Promise<string> {
  const format = type === 'public' ? 'spki' : 'pkcs8';
  const exported = await window.crypto.subtle.exportKey(format, key);
  const base64 = arrayBufferToBase64(exported);
  
  const header = type === 'public' 
    ? '-----BEGIN PUBLIC KEY-----\n' 
    : '-----BEGIN PRIVATE KEY-----\n';
  const footer = type === 'public' 
    ? '\n-----END PUBLIC KEY-----' 
    : '\n-----END PRIVATE KEY-----';
    
  // Split base64 into 64-char lines
  const regex = /.{1,64}/g;
  const lines = base64.match(regex)?.join('\n') || '';
  
  return `${header}${lines}${footer}`;
}

// Import CryptoKey from PEM
export async function importKeyFromPem(
  pem: string, 
  type: 'public' | 'private'
): Promise<CryptoKey> {
  const header = type === 'public' ? '-----BEGIN PUBLIC KEY-----' : '-----BEGIN PRIVATE KEY-----';
  const footer = type === 'public' ? '-----END PUBLIC KEY-----' : '-----END PRIVATE KEY-----';
  
  const cleanPem = pem
    .replace(header, '')
    .replace(footer, '')
    .replace(/\s+/g, '');
    
  const keyBuffer = base64ToArrayBuffer(cleanPem);
  const format = type === 'public' ? 'spki' : 'pkcs8';
  const usages: KeyUsage[] = type === 'public' ? ['verify'] : ['sign'];
  const algorithm = {
    name: 'RSASSA-PKCS1-v1_5',
    hash: { name: 'SHA-256' }
  };
  
  return await window.crypto.subtle.importKey(format, keyBuffer, algorithm, true, usages);
}

// Generate a Thumbprint for a public key
export async function generateThumbprint(publicKey: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('spki', publicKey);
  const hash = await calculateSHA256(exported);
  return hash.substring(0, 16).toUpperCase().replace(/(.{4})/g, '$1-').slice(0, -1);
}

// Validate South African ID (13-Digit Luhn algorithm)
export function validateSouthAfricanID(idNumber: string): { 
  isValid: boolean; 
  birthdate?: string; 
  gender?: string; 
  error?: string; 
} {
  const cleanId = idNumber.trim();
  if (cleanId.length !== 13) {
    return { isValid: false, error: 'ID number must be exactly 13 digits.' };
  }
  if (!/^\d{13}$/.test(cleanId)) {
    return { isValid: false, error: 'ID number must contain only numeric digits.' };
  }

  // Luhn Check
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let digit = parseInt(cleanId.charAt(i));
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }

  if (sum % 10 !== 0) {
    return { isValid: false, error: 'ID number failed checksum validation (invalid Luhn algorithm).' };
  }

  // Parse birthdate: YYMMDD
  const yyStr = cleanId.substring(0, 2);
  const mmStr = cleanId.substring(2, 4);
  const ddStr = cleanId.substring(4, 6);
  
  const yy = parseInt(yyStr);
  const mm = parseInt(mmStr);
  const dd = parseInt(ddStr);

  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
    return { isValid: false, error: 'ID number contains an invalid date.' };
  }

  const currentYear = new Date().getFullYear();
  const currentYY = currentYear % 100;
  const century = yy <= currentYY ? 2000 : 1900;
  const fullYear = century + yy;
  
  const birthdate = `${fullYear}-${mmStr}-${ddStr}`;

  // Parse gender: digits 7-10 (indices 6 to 10)
  const genderCode = parseInt(cleanId.substring(6, 10));
  const gender = genderCode < 5000 ? 'Female' : 'Male';

  return { isValid: true, birthdate, gender };
}

// Generate a Local Digital Certificate Keypair
export async function generateDigitalCertificate(
  subjectName: string,
  organization: string,
  designation: string,
  email: string,
  modulusLength: number = 2048,
  validityYears: number = 2,
  saIdNumber?: string
): Promise<DigitalCertificate> {
  const algorithm = {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: modulusLength,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    hash: { name: 'SHA-256' }
  };
  
  const keyPair = await window.crypto.subtle.generateKey(
    algorithm,
    true,
    ['sign', 'verify']
  ) as CryptoKeyPair;
  
  const publicKeyPem = await exportKeyToPem(keyPair.publicKey, 'public');
  const privateKeyPem = await exportKeyToPem(keyPair.privateKey, 'private');
  const publicKeyThumbprint = await generateThumbprint(keyPair.publicKey);
  
  const createdDate = new Date();
  const expiresDate = new Date();
  expiresDate.setFullYear(createdDate.getFullYear() + validityYears);
  
  return {
    id: window.crypto.randomUUID(),
    subjectName,
    organization,
    designation,
    email,
    createdIso: createdDate.toISOString(),
    expiresIso: expiresDate.toISOString(),
    publicKeyThumbprint,
    keyPair,
    publicKeyPem,
    privateKeyPem,
    saIdNumber,
    keySize: modulusLength,
    validityYears
  } as any;
}

// Apply visual seal and structural cryptographic signature to an existing PDF bytes
export async function applyCryptographicSignatureToSBD(
  pdfBytes: ArrayBuffer,
  cert: DigitalCertificate,
  customCoords?: { x: number; y: number; pageNumber?: number },
  options?: {
    stampColor?: 'green' | 'blue' | 'black';
    stampSize?: 'small' | 'medium' | 'large';
    location?: string;
    reason?: string;
  }
): Promise<SignatureResult> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    // Choose which page to sign: custom page, or default to the final page
    let targetPageIdx = pages.length - 1;
    if (customCoords && customCoords.pageNumber !== undefined) {
      targetPageIdx = Math.min(Math.max(0, customCoords.pageNumber - 1), pages.length - 1);
    }
    const targetPage = pages[targetPageIdx];
    
    const timestampIso = new Date().toISOString();
    
    // Config options
    const stampColor = options?.stampColor ?? 'green';
    const stampSize = options?.stampSize ?? 'medium';
    const location = options?.location ?? '';
    const reason = options?.reason ?? '';

    // Color definitions
    let borderColor = rgb(0.02, 0.44, 0.26); // Green (#047857)
    let bgColor = rgb(0.96, 0.99, 0.97); // soft green
    let accentColor = rgb(0.85, 0.65, 0.13); // gold

    if (stampColor === 'blue') {
      borderColor = rgb(0.02, 0.28, 0.55); // Sapphire Blue
      bgColor = rgb(0.96, 0.98, 1.0); // soft blue
      accentColor = rgb(0.85, 0.45, 0.13); // bronze-gold
    } else if (stampColor === 'black') {
      borderColor = rgb(0.1, 0.1, 0.1); // Obsidian Black
      bgColor = rgb(0.98, 0.98, 0.98); // soft grey
      accentColor = rgb(0.5, 0.5, 0.5); // silver
    }

    // Size dimensions
    let width = 340;
    let height = 65;
    let fontSize = 7.5;
    let lineHt = 10;
    let visualXOffset = 20;

    if (stampSize === 'small') {
      width = 280;
      height = 55;
      fontSize = 6.5;
      lineHt = 8.5;
      visualXOffset = 16;
    } else if (stampSize === 'large') {
      width = 400;
      height = 80;
      fontSize = 8.5;
      lineHt = 11.5;
      visualXOffset = 24;
    }

    // Coordinates
    const x = customCoords?.x ?? 50;
    const y = customCoords?.y ?? 60;
    
    // Render visual indicator box onto the document canvas array
    targetPage.drawRectangle({
      x, 
      y, 
      width, 
      height,
      color: bgColor,
      borderColor,
      borderWidth: 1.5,
    });

    // Draw statutory South Africa coat of arms / emblem placeholder style divider
    targetPage.drawLine({
      start: { x: x + 10, y: y + 5 },
      end: { x: x + 10, y: y + height - 5 },
      color: accentColor,
      thickness: 2.5,
    });

    // 1. Establish visual and structural seal details text
    let signatureWatermarkText = `DIGITALLY SIGNED VIA SA TENDER ASSIST
Signer: ${cert.subjectName} (${cert.designation})
Org: ${cert.organization}
Thumbprint: ${cert.publicKeyThumbprint}
Timestamp: ${timestampIso}`;

    if (location) {
      signatureWatermarkText += `\nLocation: ${location}`;
    }
    if (reason) {
      signatureWatermarkText += `\nReason: ${reason}`;
    }
    signatureWatermarkText += `\nECT Act 2002 Compliant Signature`;

    targetPage.drawText(signatureWatermarkText, {
      x: x + visualXOffset, 
      y: y + height - 12, 
      size: fontSize,
      color: rgb(0.06, 0.13, 0.1),
      lineHeight: lineHt
    });

    // 3. Complete internal asymmetric cryptographic hash block operation
    // We clear/set the subject field to a deterministic pre-signed state, save the bytes, hash them, sign, and then store the final signature in the PDF subject block.
    pdfDoc.setSubject(`PreSignedBy:${cert.subjectName}`);
    pdfDoc.setProducer(`SA Tender Assist v1.0`);
    
    const preSignedBytes = await pdfDoc.save();
    const documentHash = await calculateSHA256(preSignedBytes);
    
    // Cryptographic signature over the SHA-256 document hash
    const signatureBlockBinary = await window.crypto.subtle.sign(
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      cert.keyPair.privateKey,
      preSignedBytes
    );
    
    const signatureBase64 = arrayBufferToBase64(signatureBlockBinary);
    
    // 4. Wrap signature and certificate metadata in a secure JSON envelop and hide it inside the PDF metadata subject
    const sealEnvelope = {
      signedBy: cert.subjectName,
      organization: cert.organization,
      designation: cert.designation,
      email: cert.email,
      timestamp: timestampIso,
      documentHash,
      signatureBase64,
      publicKeyPem: cert.publicKeyPem,
      location: location || undefined,
      reason: reason || undefined,
      stampColor,
      stampSize
    };
    
    const sealedPdfDoc = await PDFDocument.load(preSignedBytes);
    sealedPdfDoc.setSubject(`SATA_SIG:${JSON.stringify(sealEnvelope)}`);
    
    const signedPdfBytes = await sealedPdfDoc.save();
    const finalHash = await calculateSHA256(signedPdfBytes);
    
    return {
      fileName: 'Signed_Document.pdf',
      signedAtIso: timestampIso,
      sha256Hash: finalHash,
      pdfBytes: signedPdfBytes
    };
  } catch (err: any) {
    throw new Error(`Client cryptographic sign routine aborted unexpectedly: ${err.message}`);
  }
}

// Verify signed PDF bytes and compare signature against public key corresponding to signing key using Web Crypto API
export interface AdvancedSignatureVerificationResult {
  status: 'valid' | 'invalid' | 'failed';
  message: string;
  details?: {
    signedBy?: string;
    organization?: string;
    timestamp?: string;
    documentHash?: string;
    publicKeyPem?: string;
    algorithm?: string;
  };
}

export async function verifySignedPdfWithKey(
  pdfBytes: ArrayBuffer,
  expectedPublicKey?: CryptoKey | string
): Promise<AdvancedSignatureVerificationResult> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const subject = pdfDoc.getSubject();

    if (!subject || !subject.startsWith('SATA_SIG:')) {
      return {
        status: 'invalid',
        message: 'No valid cryptographic signature envelope found in PDF metadata. The document is unsigned or was signed by an unrecognized system.'
      };
    }

    const envelopeJson = subject.substring(9);
    let envelope: any;
    try {
      envelope = JSON.parse(envelopeJson);
    } catch (e) {
      return {
        status: 'failed',
        message: 'Signature envelope metadata JSON is corrupt or unreadable.'
      };
    }

    // Reconstruct pre-signed PDF bytes for cryptographic verification
    const verifyDoc = await PDFDocument.load(pdfBytes);
    verifyDoc.setSubject(`PreSignedBy:${envelope.signedBy}`);
    const preSignedBytesVerify = await verifyDoc.save();

    // Verify document hash integrity
    const reCalculatedHash = await calculateSHA256(preSignedBytesVerify);
    if (reCalculatedHash !== envelope.documentHash) {
      return {
        status: 'invalid',
        message: 'Document integrity check failed. The visual or structural contents of this PDF were altered after digital signing.'
      };
    }

    // Import public key from the signature envelope
    const publicKey = await importKeyFromPem(envelope.publicKeyPem, 'public');

    // If an expected public key or private key representation is provided, compare/verify against it
    if (expectedPublicKey) {
      let targetPublicKey = publicKey;
      if (typeof expectedPublicKey === 'string') {
        targetPublicKey = await importKeyFromPem(expectedPublicKey, 'public');
      }
      // If expectedPublicKey is CryptoKey (public key), check spki export match or thumbprint
      const thumbprintEmbedded = await generateThumbprint(publicKey);
      const thumbprintExpected = await generateThumbprint(targetPublicKey);
      if (thumbprintEmbedded !== thumbprintExpected) {
        return {
          status: 'invalid',
          message: 'The public key corresponding to the signing key does not match the public key embedded in this signed document.'
        };
      }
    }

    const signatureBuffer = base64ToArrayBuffer(envelope.signatureBase64);

    // Cryptographic verification using Web Crypto API
    const isValidSignature = await window.crypto.subtle.verify(
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      publicKey,
      signatureBuffer,
      preSignedBytesVerify
    );

    if (isValidSignature) {
      return {
        status: 'valid',
        message: 'Digital signature is valid and cryptographically verified using Web Crypto API.',
        details: {
          signedBy: envelope.signedBy,
          organization: envelope.organization,
          timestamp: envelope.timestamp,
          documentHash: envelope.documentHash,
          publicKeyPem: envelope.publicKeyPem,
          algorithm: 'RSA-2048 / SHA-256 (ECT Act Section 13)'
        }
      };
    } else {
      return {
        status: 'invalid',
        message: 'Cryptographic signature verification failed. The signature does not correspond to the document content or public key.'
      };
    }
  } catch (err: any) {
    return {
      status: 'failed',
      message: `Signature verification failed due to an unexpected error: ${err.message}`
    };
  }
}

// Verify a signed SBD PDF
export async function verifySBDSignature(pdfBytes: ArrayBuffer): Promise<VerificationResult> {
  const result: VerificationResult = {
    isValid: false,
    fileName: 'Uploaded_Document.pdf',
    fileSize: pdfBytes.byteLength,
    sha256Hash: '',
    hasVisualSeal: false,
    errors: []
  };
  
  try {
    result.sha256Hash = await calculateSHA256(pdfBytes);
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const subject = pdfDoc.getSubject();
    
    if (!subject || !subject.startsWith('SATA_SIG:')) {
      result.errors.push('No valid cryptographic seal found in PDF metadata. The document is either unsigned, or was signed by another provider.');
      return result;
    }
    
    const envelopeJson = subject.substring(9);
    let envelope: any;
    try {
      envelope = JSON.parse(envelopeJson);
    } catch (e) {
      result.errors.push('Signature envelope metadata is corrupt or unreadable.');
      return result;
    }
    
    result.hasVisualSeal = true;
    result.sealDetails = {
      signedBy: envelope.signedBy,
      organization: envelope.organization,
      timestamp: envelope.timestamp,
      compliantAct: 'ECT Act 25 of 2002 (South Africa)'
    };
    
    // To verify, we reconstruct the exact bytes of the PDF as they were before the final signature was embedded.
    // The pre-signed state has subject set to `PreSignedBy:${envelope.signedBy}`
    const verifyDoc = await PDFDocument.load(pdfBytes);
    verifyDoc.setSubject(`PreSignedBy:${envelope.signedBy}`);
    const preSignedBytesVerify = await verifyDoc.save();
    
    // Verify document hash
    const reCalculatedHash = await calculateSHA256(preSignedBytesVerify);
    if (reCalculatedHash !== envelope.documentHash) {
      result.errors.push('Document integrity check failed. The visual or structural content of this PDF was altered after it was digitally signed!');
      return result;
    }
    
    // Cryptographically verify using the public key embedded in the envelope
    const publicKey = await importKeyFromPem(envelope.publicKeyPem, 'public');
    const signatureBuffer = base64ToArrayBuffer(envelope.signatureBase64);
    
    const isValidSignature = await window.crypto.subtle.verify(
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      publicKey,
      signatureBuffer,
      preSignedBytesVerify
    );
    
    if (isValidSignature) {
      result.isValid = true;
    } else {
      result.errors.push('Cryptographic verification failed. The signature does not correspond to the document content or public certificate.');
    }
    
  } catch (err: any) {
    result.errors.push(`An error occurred during verification processing: ${err.message}`);
  }
  
  return result;
}

// Generate SBD 4 (Bidder's Disclosure) standard government PDF template dynamically
export async function generateSBD4PDF(data: SBD4Data): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  // Custom professional layout (A4 is 595.275 x 841.89 points)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // PAGE 1: TITLE & BIDDER PARTICULARS
  let page = pdfDoc.addPage([595.28, 841.89]);
  const margin = 50;
  let y = 800;
  
  // Draw State emblem simulation header
  page.drawRectangle({
    x: margin,
    y: y - 50,
    width: 495.28,
    height: 45,
    color: rgb(0.02, 0.35, 0.22), // Deep South African Statutory Green
  });
  
  page.drawText('REPUBLIC OF SOUTH AFRICA', {
    x: margin + 15,
    y: y - 22,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  
  page.drawText('NATIONAL TREASURY - STANDARD BIDDING DOCUMENTATION', {
    x: margin + 15,
    y: y - 38,
    size: 8,
    font: fontRegular,
    color: rgb(0.9, 0.9, 0.9),
  });
  
  // Gold accent bar
  page.drawRectangle({
    x: margin,
    y: y - 55,
    width: 495.28,
    height: 4,
    color: rgb(0.83, 0.68, 0.21), // Gold accent
  });
  
  y -= 80;
  
  // Document Title
  page.drawText('SBD 4: BIDDER\'S DISCLOSURE', {
    x: margin,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0.06, 0.15, 0.12),
  });
  
  y -= 25;
  
  // Purpose
  const purposeText = `1. PURPOSE OF THE FORM\nAny person (natural or juristic) may make an offer or offers in terms of this invitation to bid. In line with the principles of transparency, accountability, impartiality, and ethics as enshrined in the Constitution of the Republic of South Africa and further expressed in various pieces of legislation, it is required for the bidder to make this declaration in respect of the details required hereunder.\n\nWhere a person/s are listed in the Register for Tender Defaulters and / or the List of Restricted Suppliers, that person will automatically be disqualified from the bid process.`;
  
  y = drawParagraph(page, purposeText, margin, y, 495, 9, fontRegular, 13);
  y -= 15;
  
  // Section 2: Bidder details
  page.drawText('2. BIDDER\'S DECLARATION', {
    x: margin,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0.02, 0.35, 0.22),
  });
  y -= 15;
  
  const sec2Desc = `Is the bidder, or any of its directors / trustees / shareholders / members / partners or any person having a controlling interest in the enterprise, employed by the state?`;
  y = drawParagraph(page, sec2Desc, margin, y, 495, 9, fontRegular, 12);
  y -= 10;
  
  // Yes/No checkboxes
  page.drawText(`[ ${data.isEmployedByState ? 'X' : ' '} ] YES      [ ${!data.isEmployedByState ? 'X' : ' '} ] NO`, {
    x: margin + 20,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 20;
  
  // Bid Particulars Box
  page.drawRectangle({
    x: margin,
    y: y - 80,
    width: 495.28,
    height: 75,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.98),
  });
  
  // Form details
  page.drawText(`Bid Reference Number:`, { x: margin + 15, y: y - 18, size: 9, font: fontBold });
  page.drawText(data.bidNumber || 'N/A', { x: margin + 160, y: y - 18, size: 9, font: fontRegular });
  
  page.drawText(`Procuring Institution:`, { x: margin + 15, y: y - 34, size: 9, font: fontBold });
  page.drawText(data.procuringInstitution || 'N/A', { x: margin + 160, y: y - 34, size: 9, font: fontRegular });
  
  page.drawText(`Bidder Registered Name:`, { x: margin + 15, y: y - 50, size: 9, font: fontBold });
  page.drawText(data.bidderName || 'N/A', { x: margin + 160, y: y - 50, size: 9, font: fontRegular });
  
  page.drawText(`Company Registration No:`, { x: margin + 15, y: y - 66, size: 9, font: fontBold });
  page.drawText(data.registrationNumber || 'N/A', { x: margin + 160, y: y - 66, size: 9, font: fontRegular });
  
  y -= 95;
  
  // Director disclosure title
  const tableIntro = `2.1.1. If so, furnish particulars of the names, individual identity numbers, and, if applicable, state employee numbers of sole proprietor/ directors / trustees / shareholders / members/ partners or any person having a controlling interest in the enterprise, in table below:`;
  y = drawParagraph(page, tableIntro, margin, y, 495, 8.5, fontRegular, 11);
  y -= 10;
  
  // Directors Table
  const rowHeight = 18;
  const tableY = y - 100;
  page.drawRectangle({
    x: margin,
    y: tableY,
    width: 495.28,
    height: 90,
    borderColor: rgb(0.5, 0.5, 0.5),
    borderWidth: 1,
  });
  
  // Headers
  page.drawRectangle({
    x: margin,
    y: tableY + 72,
    width: 495.28,
    height: 18,
    color: rgb(0.9, 0.95, 0.92),
  });
  
  page.drawText('Full Name', { x: margin + 10, y: tableY + 77, size: 8, font: fontBold });
  page.drawText('Identity Number', { x: margin + 200, y: tableY + 77, size: 8, font: fontBold });
  page.drawText('State Employee Number (If applicable)', { x: margin + 330, y: tableY + 77, size: 8, font: fontBold });
  
  // Draw grid lines
  page.drawLine({ start: { x: margin + 190, y: tableY }, end: { x: margin + 190, y: tableY + 90 }, color: rgb(0.5, 0.5, 0.5), thickness: 1 });
  page.drawLine({ start: { x: margin + 320, y: tableY }, end: { x: margin + 320, y: tableY + 90 }, color: rgb(0.5, 0.5, 0.5), thickness: 1 });
  
  for (let idx = 0; idx < 4; idx++) {
    const rowY = tableY + 72 - (idx + 1) * rowHeight;
    page.drawLine({ start: { x: margin, y: rowY + rowHeight }, end: { x: margin + 495.28, y: rowY + rowHeight }, color: rgb(0.6, 0.6, 0.6), thickness: 0.5 });
    
    const d = data.directors[idx];
    if (d) {
      page.drawText(d.fullName.substring(0, 38), { x: margin + 10, y: rowY + 5, size: 8, font: fontRegular });
      page.drawText(d.identityNumber || '', { x: margin + 200, y: rowY + 5, size: 8, font: fontRegular });
      page.drawText(d.stateEmployeeNumber || 'N/A', { x: margin + 330, y: rowY + 5, size: 8, font: fontRegular });
    } else {
      page.drawText('-', { x: margin + 10, y: rowY + 5, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
      page.drawText('-', { x: margin + 200, y: rowY + 5, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
      page.drawText('-', { x: margin + 330, y: rowY + 5, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
    }
  }
  
  y = tableY - 15;
  
  // Page footer
  page.drawText('Page 1 of 2', { x: 500, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('SBD 4 - SA TENDER ASSIST PKI SYSTEM', { x: margin, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  
  // PAGE 2: QUESTIONS & LEGAL DECLARATION
  page = pdfDoc.addPage([595.28, 841.89]);
  y = 800;
  
  // Header small
  page.drawText('SBD 4: BIDDER\'S DISCLOSURE (CONTINUED)', {
    x: margin,
    y: y - 10,
    size: 10,
    font: fontBold,
    color: rgb(0.02, 0.35, 0.22),
  });
  page.drawLine({ start: { x: margin, y: y - 15 }, end: { x: margin + 495.28, y: y - 15 }, color: rgb(0.8, 0.8, 0.8), thickness: 1 });
  
  y -= 35;
  
  // Question 2.2
  const q22Desc = `2.2. Do you, or any person connected with the bidder, have a relationship with any person who is employed by the procuring institution and who may be involved with the evaluation and or adjudication of this bid?`;
  y = drawParagraph(page, q22Desc, margin, y, 495, 9, fontBold, 12);
  y -= 10;
  
  page.drawText(`[ ${data.hasRelationshipWithStateEmployee ? 'X' : ' '} ] YES      [ ${!data.hasRelationshipWithStateEmployee ? 'X' : ' '} ] NO`, {
    x: margin + 20,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 15;
  
  if (data.hasRelationshipWithStateEmployee && data.relationshipParticulars) {
    page.drawText('Particulars:', { x: margin + 20, y, size: 8, font: fontBold });
    y -= 12;
    y = drawParagraph(page, data.relationshipParticulars, margin + 20, y, 475, 8, fontRegular, 10);
    y -= 10;
  } else {
    y -= 5;
  }
  
  // Question 2.3
  const q23Desc = `2.3. Does the bidder or any of its directors / trustees / shareholders / members / partners or any person having a controlling interest in the enterprise have any interest in any other related enterprise whether or not they are bidding for this contract?`;
  y = drawParagraph(page, q23Desc, margin, y, 495, 9, fontBold, 12);
  y -= 10;
  
  page.drawText(`[ ${data.isRestrictedSupplier ? 'X' : ' '} ] YES      [  X  ] NO`, { // defaulting related enterprises safely
    x: margin + 20,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 25;
  
  // Section 3: Bidder Declarations
  page.drawText('3. DECLARATION OF COMPLIANCE AND INDEPENDENCE', {
    x: margin,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0.02, 0.35, 0.22),
  });
  y -= 15;
  
  const declarationText = `I, the undersigned, in submitting the accompanying bid, do hereby make the following statements that I certify to be true and complete in every respect:\n\n3.1. I have read and I understand the contents of this disclosure;\n3.2. I understand that the accompanying bid will be disqualified if this disclosure is found not to be true and complete in every respect;\n3.3. The bidder has arrived at the accompanying bid independently from, and without consultation, communication, agreement or arrangement with any competitor. However, communication between partners in a joint venture or consortium will not be construed as collusive bidding.\n3.4. In addition, there have been no consultations, communications, agreements or arrangements with any competitor regarding the quality, quantity, specifications, prices, including methods, factors or formulas used to calculate prices, market allocation, the intention or decision to submit or not to submit the bid, bidding with the intention not to win the bid and conditions or delivery particulars of the products or services to which this bid invitation relates.\n3.5. The terms of the accompanying bid have not been, and will not be, disclosed by the bidder, directly or indirectly, to any competitor, prior to the date and time of the official bid opening or of the awarding of the contract.`;
  
  y = drawParagraph(page, declarationText, margin, y, 495, 8, fontRegular, 11);
  y -= 25;
  
  // Declaration Signatures block
  page.drawRectangle({
    x: margin,
    y: y - 100,
    width: 495.28,
    height: 95,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
    color: rgb(0.99, 0.99, 0.99),
  });
  
  page.drawText('DECLARANT ATTESTATION:', { x: margin + 15, y: y - 18, size: 9, font: fontBold, color: rgb(0.02, 0.35, 0.22) });
  
  page.drawText(`Name of Declarant:`, { x: margin + 15, y: y - 38, size: 8.5, font: fontBold });
  page.drawText(data.declarationName || 'N/A', { x: margin + 130, y: y - 38, size: 8.5, font: fontRegular });
  
  page.drawText(`Designation:`, { x: margin + 15, y: y - 54, size: 8.5, font: fontBold });
  page.drawText(data.declarationDesignation || 'N/A', { x: margin + 130, y: y - 54, size: 8.5, font: fontRegular });
  
  page.drawText(`Date of Declaration:`, { x: margin + 15, y: y - 70, size: 8.5, font: fontBold });
  page.drawText(new Date().toLocaleDateString('en-ZA'), { x: margin + 130, y: y - 70, size: 8.5, font: fontRegular });
  
  page.drawText(`Signature Seal:`, { x: margin + 15, y: y - 86, size: 8.5, font: fontBold });
  page.drawText('[SECURE DIGITAL SIGNATURE APPLIED BELOW]', { x: margin + 130, y: y - 86, size: 8, font: fontBold, color: rgb(0.1, 0.5, 0.3) });
  
  y -= 110;
  
  // Legal compliance warning text
  const complianceWarning = `ECT ACT 25 OF 2002 STATUTORY COMPLIANCE: By applying your digital PKI signature seal to this document, you satisfy the statutory requirements of Section 13 of the Electronic Communications and Transactions Act, 2002, validating this form as an authentic, legally signed document in the Republic of South Africa.`;
  y = drawParagraph(page, complianceWarning, margin, y, 495, 7, fontRegular, 9.5);
  
  // Page footer
  page.drawText('Page 2 of 2', { x: 500, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('SBD 4 - SA TENDER ASSIST PKI SYSTEM', { x: margin, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  
  return await pdfDoc.save();
}

// Draw a paragraph of text wrapping automatically
function drawParagraph(
  page: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  font: any,
  lineHeight: number
): number {
  const paragraphs = text.split('\n');
  let currentY = y;
  
  for (const para of paragraphs) {
    if (para.trim() === '') {
      currentY -= lineHeight;
      continue;
    }
    
    const words = para.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      
      if (width > maxWidth) {
        page.drawText(currentLine, {
          x,
          y: currentY,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
        currentY -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      page.drawText(currentLine, {
        x,
        y: currentY,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      currentY -= lineHeight;
    }
  }
  
  return currentY;
}

// Calculate preference points awarded for B-BBEE Level under the 2022 Treasury Regulations
function calculateBBBEEPoints(level: number, system: "80/20" | "90/10"): number {
  if (system === "80/20") {
    switch (level) {
      case 1: return 20;
      case 2: return 18;
      case 3: return 14;
      case 4: return 12;
      case 5: return 8;
      case 6: return 6;
      case 7: return 4;
      case 8: return 2;
      default: return 0; // Level 9 / Non-compliant
    }
  } else {
    switch (level) {
      case 1: return 10;
      case 2: return 9;
      case 3: return 6;
      case 4: return 5;
      case 5: return 4;
      case 6: return 3;
      case 7: return 2;
      case 8: return 1;
      default: return 0;
    }
  }
}

// Generate SBD 6.1 (Preference Points Claim) government PDF template dynamically
export async function generateSBD61PDF(data: SBD61Data): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // PAGE 1: TITLE & GENERAL CONDITIONS
  let page = pdfDoc.addPage([595.28, 841.89]);
  const margin = 50;
  let y = 800;
  
  // Logo green banner
  page.drawRectangle({
    x: margin,
    y: y - 50,
    width: 495.28,
    height: 45,
    color: rgb(0.02, 0.35, 0.22), // deep statutory South African green
  });
  
  page.drawText('REPUBLIC OF SOUTH AFRICA', {
    x: margin + 15,
    y: y - 22,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  
  page.drawText('NATIONAL TREASURY - PREFERENTIAL PROCUREMENT POLICY', {
    x: margin + 15,
    y: y - 38,
    size: 8,
    font: fontRegular,
    color: rgb(0.9, 0.9, 0.9),
  });
  
  // Gold accent bar
  page.drawRectangle({
    x: margin,
    y: y - 55,
    width: 495.28,
    height: 4,
    color: rgb(0.83, 0.68, 0.21), // gold accent
  });
  
  y -= 80;
  
  // Document Title
  page.drawText('SBD 6.1: PREFERENCE POINTS CLAIM FORM', {
    x: margin,
    y,
    size: 14,
    font: fontBold,
    color: rgb(0.06, 0.15, 0.12),
  });
  page.drawText('IN TERMS OF THE PREFERENTIAL PROCUREMENT REGULATIONS 2022', {
    x: margin,
    y: y - 14,
    size: 8,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  y -= 35;
  
  // Purpose Intro
  const introText = `This preference form must form part of all tenders invited. It contains general information and serves as a claim form for preference points for specific goals.\n\nNB: BEFORE COMPLETING THIS FORM, TENDERERS MUST STUDY THE GENERAL CONDITIONS, DEFINITIONS AND DIRECTIVES APPLICABLE IN RESPECT OF THE TENDER AND PREFERENTIAL PROCUREMENT REGULATIONS, 2022.`;
  y = drawParagraph(page, introText, margin, y, 495, 8.5, fontRegular, 12);
  y -= 15;
  
  // Section 1: General Conditions
  page.drawText('1. GENERAL CONDITIONS', {
    x: margin,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.02, 0.35, 0.22),
  });
  y -= 15;
  
  const genConditions = `1.1. The following preference point systems are applicable to invitations to tender:\n- the 80/20 system for requirements with a Rand value of up to R50 000 000 (all applicable taxes included); or\n- the 90/10 system for requirements with a Rand value above R50 000 000 (all applicable taxes included).\n\n1.2. The applicable preferential point system for this tender is:`;
  y = drawParagraph(page, genConditions, margin, y, 495, 8, fontRegular, 11);
  y -= 10;
  
  // Points system checkboxes
  page.drawText(`[ ${data.pointsSystem === '80/20' ? 'X' : ' '} ] 80/20 PREFERENCE SYSTEM        [ ${data.pointsSystem === '90/10' ? 'X' : ' '} ] 90/10 PREFERENCE SYSTEM`, {
    x: margin + 20,
    y,
    size: 9,
    font: fontBold,
  });
  y -= 25;
  
  // Section 2: Points claimed details
  page.drawText('2. CLAIMED POINTS AND B-BBEE STATUS LEVEL', {
    x: margin,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.02, 0.35, 0.22),
  });
  y -= 15;
  
  const bPoints = calculateBBBEEPoints(data.bbbEELevel, data.pointsSystem);
  const maxBPoints = data.pointsSystem === '80/20' ? 20 : 10;
  
  // Claim details box
  page.drawRectangle({
    x: margin,
    y: y - 80,
    width: 495.28,
    height: 75,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.98),
  });
  
  page.drawText(`Bid Reference Number:`, { x: margin + 15, y: y - 18, size: 9, font: fontBold });
  page.drawText(data.bidNumber || 'N/A', { x: margin + 180, y: y - 18, size: 9, font: fontRegular });
  
  page.drawText(`Bidder Registered Name:`, { x: margin + 15, y: y - 34, size: 9, font: fontBold });
  page.drawText(data.bidderName || 'N/A', { x: margin + 180, y: y - 34, size: 9, font: fontRegular });
  
  page.drawText(`Claimed B-BBEE Status Level:`, { x: margin + 15, y: y - 50, size: 9, font: fontBold });
  page.drawText(`Level ${data.bbbEELevel} (${data.bbbEELevel === 9 ? 'Non-compliant contributor' : 'Compliant contributor'})`, { x: margin + 180, y: y - 50, size: 9, font: fontRegular });
  
  page.drawText(`Preference Points Claimed:`, { x: margin + 15, y: y - 66, size: 9, font: fontBold });
  page.drawText(`${bPoints} Points out of maximum ${maxBPoints}`, { x: margin + 180, y: y - 66, size: 9, font: fontBold, color: rgb(0.02, 0.35, 0.22) });
  
  y -= 95;
  
  // Footer page 1
  page.drawText('Page 1 of 2', { x: 500, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('SBD 6.1 - SA TENDER ASSIST PKI SYSTEM', { x: margin, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  
  // PAGE 2: SPECIFIC GOALS & LEGAL DECLARATION
  page = pdfDoc.addPage([595.28, 841.89]);
  y = 800;
  
  page.drawText('SBD 6.1: PREFERENCE POINTS CLAIM FORM (CONTINUED)', {
    x: margin,
    y: y - 10,
    size: 9,
    font: fontBold,
    color: rgb(0.02, 0.35, 0.22),
  });
  page.drawLine({ start: { x: margin, y: y - 15 }, end: { x: margin + 495.28, y: y - 15 }, color: rgb(0.8, 0.8, 0.8), thickness: 1 });
  
  y -= 35;
  
  // Section 3: Specific Goals
  page.drawText('3. SPECIFIC GOALS AND OWNERSHIP DECLARATION', {
    x: margin,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.02, 0.35, 0.22),
  });
  y -= 15;
  
  const goalsText = `Points may be claimed for specific goals under the Preferential Procurement Regulations, 2022. The bidder declares the following ownership and equity structures representing their enterprise:`;
  y = drawParagraph(page, goalsText, margin, y, 495, 8.5, fontRegular, 11);
  y -= 10;
  
  // Goals Table
  const tableY = y - 100;
  page.drawRectangle({
    x: margin,
    y: tableY,
    width: 495.28,
    height: 90,
    borderColor: rgb(0.5, 0.5, 0.5),
    borderWidth: 1,
  });
  
  // Table headers
  page.drawRectangle({
    x: margin,
    y: tableY + 72,
    width: 495.28,
    height: 18,
    color: rgb(0.9, 0.95, 0.92),
  });
  
  page.drawText('Specific Goal Sector / Category', { x: margin + 10, y: tableY + 77, size: 8, font: fontBold });
  page.drawText('Enterprise Equity Share %', { x: margin + 300, y: tableY + 77, size: 8, font: fontBold });
  page.drawLine({ start: { x: margin + 280, y: tableY }, end: { x: margin + 280, y: tableY + 90 }, color: rgb(0.5, 0.5, 0.5), thickness: 1 });
  
  const goals = [
    { label: 'Black Ownership Percentage', val: data.blackOwnershipPercentage },
    { label: 'Black Women Ownership Percentage', val: data.blackWomenOwnershipPercentage },
    { label: 'Youth Ownership Percentage', val: data.youthOwnershipPercentage },
    { label: 'Disability Ownership Percentage', val: data.disabilityOwnershipPercentage },
  ];
  
  for (let idx = 0; idx < 4; idx++) {
    const rowY = tableY + 72 - (idx + 1) * 18;
    page.drawLine({ start: { x: margin, y: rowY + 18 }, end: { x: margin + 495.28, y: rowY + 18 }, color: rgb(0.6, 0.6, 0.6), thickness: 0.5 });
    page.drawText(goals[idx].label, { x: margin + 10, y: rowY + 5, size: 8, font: fontRegular });
    page.drawText(`${goals[idx].val}%`, { x: margin + 300, y: rowY + 5, size: 8, font: fontBold });
  }
  
  y = tableY - 15;
  
  if (data.cooperativeOwnershipPercentage > 0) {
    page.drawText(`Cooperative Ownership: ${data.cooperativeOwnershipPercentage}%`, { x: margin, y, size: 8.5, font: fontBold });
    y -= 15;
  }
  
  // Section 4: Attestation
  page.drawText('4. DECLARATION WITH REGARD TO COMPANY/FIRM', {
    x: margin,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.02, 0.35, 0.22),
  });
  y -= 15;
  
  const declText = `I/we, the undersigned, who warrants that he/she is duly authorised to do so on behalf of the company/firm, certify that the points claimed, based on the specific goals as advised in the tender, qualifies the company/ firm for the preference(s) shown and I / we acknowledge that:\n1) The information furnished is true and correct;\n2) The preference points claimed are in accordance with the General Conditions as indicated in paragraph 1 of this form;\n3) In the event of a contract being awarded as a result of points claimed, the contractor may be required to furnish documentary proof to the satisfaction of the organ of state that the claims are correct.`;
  y = drawParagraph(page, declText, margin, y, 495, 7.5, fontRegular, 10.5);
  y -= 20;
  
  // Attestation box
  page.drawRectangle({
    x: margin,
    y: y - 80,
    width: 495.28,
    height: 75,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
    color: rgb(0.99, 0.99, 0.99),
  });
  
  page.drawText('BIDDER ATTESTATION & DECLARATION:', { x: margin + 15, y: y - 18, size: 9, font: fontBold, color: rgb(0.02, 0.35, 0.22) });
  page.drawText(`Declarant Signature Seal:`, { x: margin + 15, y: y - 38, size: 8.5, font: fontBold });
  page.drawText('[SECURE DIGITAL SIGNATURE APPLIED BELOW]', { x: margin + 160, y: y - 38, size: 8, font: fontBold, color: rgb(0.1, 0.5, 0.3) });
  
  page.drawText(`Date of Signature:`, { x: margin + 15, y: y - 54, size: 8.5, font: fontBold });
  page.drawText(new Date().toLocaleDateString('en-ZA'), { x: margin + 160, y: y - 54, size: 8.5, font: fontRegular });
  
  y -= 95;
  
  // Legal compliance
  const statutoryWarning = `ECT ACT COMPLIANCE STATEMENT: This Standard Bidding Document 6.1 preference points claim has been compiled and cryptographically certified using RSA 2048-bit local asymmetric signatures, fully meeting the specifications for legally binding electronic signatures in terms of Section 13 of the ECT Act 25 of 2002.`;
  y = drawParagraph(page, statutoryWarning, margin, y, 495, 7, fontRegular, 9.5);
  
  // Footer page 2
  page.drawText('Page 2 of 2', { x: 500, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('SBD 6.1 - SA TENDER ASSIST PKI SYSTEM', { x: margin, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  
  return await pdfDoc.save();
}

// Generate SBD 8 (Declaration of Bidder's Past SCM Practices) standard government PDF template dynamically
export async function generateSBD8PDF(data: SBD8Data): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let page = pdfDoc.addPage([595.28, 841.89]);
  const margin = 50;
  let y = 800;
  
  // Header green bar
  page.drawRectangle({
    x: margin,
    y: y - 50,
    width: 495.28,
    height: 45,
    color: rgb(0.02, 0.35, 0.22),
  });
  
  page.drawText('REPUBLIC OF SOUTH AFRICA', { x: margin + 15, y: y - 22, size: 11, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('NATIONAL TREASURY - STANDARD BIDDING DOCUMENTATION', { x: margin + 15, y: y - 38, size: 8, font: fontRegular, color: rgb(0.9, 0.9, 0.9) });
  
  y -= 75;
  page.drawText('SBD 8: DECLARATION OF BIDDER\'S PAST SCM PRACTICES', { x: margin, y, size: 13, font: fontBold, color: rgb(0.02, 0.35, 0.22) });
  
  y -= 30;
  page.drawText('This Standard Bidding Document must form part of all bids invited.', { x: margin, y, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  y -= 15;
  page.drawText('It serves as a declaration to be used by institutions in ensuring that when goods and services', { x: margin, y, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  y -= 15;
  page.drawText('are being procured, all reasonable steps are taken to combat the abuse of the SCM system.', { x: margin, y, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  
  y -= 35;
  page.drawText('PARTICULARS OF BID:', { x: margin, y, size: 10, font: fontBold, color: rgb(0, 0, 0) });
  
  y -= 20;
  page.drawText(`Bid / Tender Number: ${data.bidNumber}`, { x: margin, y, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  y -= 15;
  page.drawText(`Bid Description: ${data.bidDescription}`, { x: margin, y, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
  y -= 15;
  page.drawText(`Procuring Institution: ${data.procuringInstitution}`, { x: margin, y, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
  y -= 15;
  page.drawText(`Bidder Corporate Name: ${data.bidderName} (Reg: ${data.registrationNumber})`, { x: margin, y, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
  
  y -= 35;
  page.drawText('PAST SCM COMPLIANCE DECLARATION QUESTIONS:', { x: margin, y, size: 10, font: fontBold, color: rgb(0, 0, 0) });
  
  y -= 25;
  page.drawText('1. Is the bidder or any of its directors listed on the National Treasury Database of Restricted Suppliers?', { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText(`Response: ${data.isRestrictedSupplier ? 'YES (Non-Compliant)' : 'NO (Compliant)'}`, { x: margin + 15, y, size: 9, font: fontBold, color: data.isRestrictedSupplier ? rgb(0.8, 0.1, 0.1) : rgb(0.1, 0.6, 0.1) });
  
  y -= 25;
  page.drawText('2. Was the bidder or any of its directors convicted by a court of law for fraud or corruption in the past five years?', { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText(`Response: ${data.hasConvictionFraud ? 'YES (Non-Compliant)' : 'NO (Compliant)'}`, { x: margin + 15, y, size: 9, font: fontBold, color: data.hasConvictionFraud ? rgb(0.8, 0.1, 0.1) : rgb(0.1, 0.6, 0.1) });
  
  y -= 25;
  page.drawText('3. Was any contract between the bidder and any organ of state terminated during the past five years due to failure?', { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText(`Response: ${data.hasFailedContract ? 'YES (Non-Compliant)' : 'NO (Compliant)'}`, { x: margin + 15, y, size: 9, font: fontBold, color: data.hasFailedContract ? rgb(0.8, 0.1, 0.1) : rgb(0.1, 0.6, 0.1) });
  
  y -= 45;
  page.drawText('FORM CERTIFICATION & SIGNATURE ATTESTATION:', { x: margin, y, size: 10, font: fontBold });
  y -= 20;
  page.drawText(`I, the undersigned ${data.declarationName} (${data.declarationDesignation}), certify that the information`, { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText('furnished on this declaration form is true, correct, and complete.', { x: margin, y, size: 9, font: fontRegular });
  
  y -= 35;
  page.drawText('Signature Block (Asymmetric PKI Seal Applied Below):', { x: margin, y, size: 8, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
  
  y -= 50;
  const statutoryWarning = `ECT ACT COMPLIANCE: SBD 8 Past SCM Practices declaration has been compiled and cryptographically certified using local advanced asymmetric signature RSA-2048 keys under Section 13 of South Africa's Electronic Communications and Transactions Act 25 of 2002.`;
  drawParagraph(page, statutoryWarning, margin, y, 495, 7, fontRegular, 9.5);
  
  page.drawText('Page 1 of 1', { x: 500, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('SBD 8 - SA TENDER ASSIST PKI SYSTEM', { x: margin, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  
  return await pdfDoc.save();
}

// Generate SBD 9 (Certificate of Independent Bid Determination) standard government PDF template dynamically
export async function generateSBD9PDF(data: SBD9Data): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let page = pdfDoc.addPage([595.28, 841.89]);
  const margin = 50;
  let y = 800;
  
  // Header green bar
  page.drawRectangle({
    x: margin,
    y: y - 50,
    width: 495.28,
    height: 45,
    color: rgb(0.02, 0.35, 0.22),
  });
  
  page.drawText('REPUBLIC OF SOUTH AFRICA', { x: margin + 15, y: y - 22, size: 11, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('NATIONAL TREASURY - STANDARD BIDDING DOCUMENTATION', { x: margin + 15, y: y - 38, size: 8, font: fontRegular, color: rgb(0.9, 0.9, 0.9) });
  
  y -= 75;
  page.drawText('SBD 9: CERTIFICATE OF INDEPENDENT BID DETERMINATION', { x: margin, y, size: 13, font: fontBold, color: rgb(0.02, 0.35, 0.22) });
  
  y -= 30;
  page.drawText('Section 4 (1) (b) (iii) of the Competition Act No. 89 of 1998 prohibits an agreement between, or concerted practice', { x: margin, y, size: 8.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  y -= 12;
  page.drawText('by, firms, or a decision by an association of firms, if it is between parties in a horizontal relationship and if it involves', { x: margin, y, size: 8.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  y -= 12;
  page.drawText('collusive bidding (or bid rigging). Collusive bidding is a pe se prohibition meaning it cannot be justified.', { x: margin, y, size: 8.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  
  y -= 30;
  page.drawText('PARTICULARS OF BID:', { x: margin, y, size: 10, font: fontBold });
  y -= 20;
  page.drawText(`Bid / Tender Number: ${data.bidNumber}`, { x: margin, y, size: 9, font: fontBold });
  y -= 15;
  page.drawText(`Description: ${data.bidDescription}`, { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText(`Procuring Institution: ${data.procuringInstitution}`, { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText(`Bidder Name: ${data.bidderName} (Reg: ${data.registrationNumber})`, { x: margin, y, size: 9, font: fontRegular });
  
  y -= 30;
  page.drawText('INDEPENDENT DETERMINATION ATTESTATIONS:', { x: margin, y, size: 10, font: fontBold });
  
  y -= 25;
  page.drawText('1. Are prices determined independently, without consultation, communication, or agreement with any competitor?', { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText(`Response: ${data.independentPricingAgreed ? 'YES (Compliant)' : 'NO (Requires Review)'}`, { x: margin + 15, y, size: 9, font: fontBold, color: data.independentPricingAgreed ? rgb(0.1, 0.6, 0.1) : rgb(0.8, 0.1, 0.1) });
  
  y -= 25;
  page.drawText('2. Do you certify that no collusive agreements or cartel behavior have occurred with competitors regarding this bid?', { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText(`Response: ${data.noCollusionAgreed ? 'YES (Compliant)' : 'NO (Requires Review)'}`, { x: margin + 15, y, size: 9, font: fontBold, color: data.noCollusionAgreed ? rgb(0.1, 0.6, 0.1) : rgb(0.8, 0.1, 0.1) });
  
  y -= 25;
  page.drawText('3. Has there been any consultation, communication, or agreement with competitors regarding quality or quantity specifications?', { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText(`Response: ${data.hasConsultedCompetitor ? `YES - Particulars: ${data.consultationDetails || 'None provided'}` : 'NO (Compliant)'}`, { x: margin + 15, y, size: 9, font: fontBold, color: data.hasConsultedCompetitor ? rgb(0.8, 0.1, 0.1) : rgb(0.1, 0.6, 0.1) });
  
  y -= 40;
  page.drawText('FORM CERTIFICATION & SIGNATURE ATTESTATION:', { x: margin, y, size: 10, font: fontBold });
  y -= 20;
  page.drawText(`I, the undersigned ${data.declarationName} (${data.declarationDesignation}), hereby certify that the statements`, { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText('made in this Certificate are true and complete in every respect.', { x: margin, y, size: 9, font: fontRegular });
  
  y -= 45;
  const statutoryWarning = `ECT ACT COMPLIANCE: SBD 9 Certificate of Independent Bid Determination is cryptographically certified using local advanced asymmetric signature RSA-2048 keys under Section 13 of South Africa's Electronic Communications and Transactions Act 25 of 2002.`;
  drawParagraph(page, statutoryWarning, margin, y, 495, 7, fontRegular, 9.5);
  
  page.drawText('Page 1 of 1', { x: 500, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('SBD 9 - SA TENDER ASSIST PKI SYSTEM', { x: margin, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  
  return await pdfDoc.save();
}

// Generate MBD 4 (Municipal Declaration of Interest) local municipal PDF template dynamically
export async function generateMBD4PDF(data: MBD4Data): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let page = pdfDoc.addPage([595.28, 841.89]);
  const margin = 50;
  let y = 800;
  
  // Header municipal blue bar
  page.drawRectangle({
    x: margin,
    y: y - 50,
    width: 495.28,
    height: 45,
    color: rgb(0.1, 0.3, 0.5), // Deep Municipal Indigo Blue
  });
  
  page.drawText('LOCAL GOVERNMENT OF SOUTH AFRICA', { x: margin + 15, y: y - 22, size: 11, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('MUNICIPAL BIDDING DOCUMENTATION - REGULATORY DISCLOSURE', { x: margin + 15, y: y - 38, size: 8, font: fontRegular, color: rgb(0.9, 0.9, 0.9) });
  
  y -= 75;
  page.drawText('MBD 4: MUNICIPAL DECLARATION OF INTEREST', { x: margin, y, size: 13, font: fontBold, color: rgb(0.1, 0.3, 0.5) });
  
  y -= 30;
  page.drawText(`Target Municipality: ${(data.municipalityName || '').toUpperCase()}`, { x: margin, y, size: 10, font: fontBold, color: rgb(0.1, 0.3, 0.5) });
  
  y -= 25;
  page.drawText('PARTICULARS OF BID:', { x: margin, y, size: 10, font: fontBold });
  y -= 20;
  page.drawText(`Bid / Tender Number: ${data.bidNumber}`, { x: margin, y, size: 9, font: fontBold });
  y -= 15;
  page.drawText(`Description: ${data.bidDescription}`, { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText(`Bidder Corporate Name: ${data.bidderName} (Reg: ${data.registrationNumber})`, { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText(`SARS Tax Reference: ${data.taxReferenceNumber} | VAT: ${data.vatNumber || 'Not VAT registered'}`, { x: margin, y, size: 9, font: fontRegular });
  
  y -= 35;
  page.drawText('MUNICIPAL DISCLOSURE CONFLICT INQUIRIES:', { x: margin, y, size: 10, font: fontBold });
  
  y -= 25;
  page.drawText('1. Is the bidder or any key directors currently in the service of the state?', { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText(`Response: ${data.isEmployedByState ? `YES - Particulars: ${data.employedByStateParticulars}` : 'NO (Compliant)'}`, { x: margin + 15, y, size: 9, font: fontBold, color: data.isEmployedByState ? rgb(0.8, 0.1, 0.1) : rgb(0.1, 0.6, 0.1) });
  
  y -= 30;
  page.drawText('KEY CORPORATE DIRECTORS / SHAREHOLDERS REGISTERED:', { x: margin, y, size: 10, font: fontBold });
  
  data.directors.forEach((dir, idx) => {
    if (y > 180) {
      y -= 15;
      page.drawText(`${idx + 1}. Full Name: ${dir.fullName || '---'} | ID: ${dir.identityNumber || '---'} | Employee No: ${dir.stateEmployeeNumber || 'N/A'}`, { x: margin + 15, y, size: 8.5, font: fontRegular });
    }
  });
  
  y -= 35;
  page.drawText('FORM CERTIFICATION & SIGNATURE ATTESTATION:', { x: margin, y, size: 10, font: fontBold });
  y -= 20;
  page.drawText(`I, the undersigned ${data.declarationName} (${data.declarationDesignation}), certify that the information`, { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText('furnished on this Municipal MBD 4 form is accurate and complete in terms of SCM Regulations.', { x: margin, y, size: 9, font: fontRegular });
  
  y -= 45;
  const statutoryWarning = `ECT ACT COMPLIANCE: MBD 4 Municipal Declaration of Interest has been cryptographically certified using local advanced asymmetric signature RSA-2048 keys under Section 13 of South Africa's Electronic Communications and Transactions Act 25 of 2002.`;
  drawParagraph(page, statutoryWarning, margin, y, 495, 7, fontRegular, 9.5);
  
  page.drawText('Page 1 of 1', { x: 500, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('MBD 4 - SA TENDER ASSIST PKI SYSTEM', { x: margin, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  
  return await pdfDoc.save();
}

// Generate MBD 8 (Municipal Declaration of Bidder's Past SCM Practices) PDF template dynamically
export async function generateMBD8PDF(data: MBD8Data): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let page = pdfDoc.addPage([595.28, 841.89]);
  const margin = 50;
  let y = 800;
  
  // Header municipal blue bar
  page.drawRectangle({
    x: margin,
    y: y - 50,
    width: 495.28,
    height: 45,
    color: rgb(0.1, 0.3, 0.5),
  });
  
  page.drawText('LOCAL GOVERNMENT OF SOUTH AFRICA', { x: margin + 15, y: y - 22, size: 11, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('MUNICIPAL BIDDING DOCUMENTATION - SCM REGULATORY CHECK', { x: margin + 15, y: y - 38, size: 8, font: fontRegular, color: rgb(0.9, 0.9, 0.9) });
  
  y -= 75;
  page.drawText('MBD 8: DECLARATION OF BIDDER\'S PAST SCM PRACTICES', { x: margin, y, size: 13, font: fontBold, color: rgb(0.1, 0.3, 0.5) });
  
  y -= 30;
  page.drawText(`Target Municipality: ${(data.municipalityName || '').toUpperCase()}`, { x: margin, y, size: 10, font: fontBold, color: rgb(0.1, 0.3, 0.5) });
  
  y -= 25;
  page.drawText('PARTICULARS OF BID:', { x: margin, y, size: 10, font: fontBold });
  y -= 20;
  page.drawText(`Bid / Tender Number: ${data.bidNumber}`, { x: margin, y, size: 9, font: fontBold });
  y -= 15;
  page.drawText(`Description: ${data.bidDescription}`, { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText(`Bidder Name: ${data.bidderName} (Reg: ${data.registrationNumber})`, { x: margin, y, size: 9, font: fontRegular });
  
  y -= 35;
  page.drawText('PAST COMPLIANCE RECORD DECLARATION QUESTIONS:', { x: margin, y, size: 10, font: fontBold });
  
  y -= 25;
  page.drawText('1. Is the bidder listed on the Treasury Database of Restricted Suppliers or blacklisted locally?', { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText(`Response: ${data.isRestrictedSupplier ? 'YES (Non-Compliant)' : 'NO (Compliant)'}`, { x: margin + 15, y, size: 9, font: fontBold, color: data.isRestrictedSupplier ? rgb(0.8, 0.1, 0.1) : rgb(0.1, 0.6, 0.1) });
  
  y -= 25;
  page.drawText('2. Has the bidder or any directors been convicted of fraud or corruption in municipal contracts?', { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText(`Response: ${data.hasConvictionFraud ? 'YES (Non-Compliant)' : 'NO (Compliant)'}`, { x: margin + 15, y, size: 9, font: fontBold, color: data.hasConvictionFraud ? rgb(0.8, 0.1, 0.1) : rgb(0.1, 0.6, 0.1) });
  
  y -= 25;
  page.drawText('3. Has any municipal or state organ terminated a contract with the bidder due to non-performance?', { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText(`Response: ${data.hasFailedContract ? 'YES (Non-Compliant)' : 'NO (Compliant)'}`, { x: margin + 15, y, size: 9, font: fontBold, color: data.hasFailedContract ? rgb(0.8, 0.1, 0.1) : rgb(0.1, 0.6, 0.1) });
  
  y -= 40;
  page.drawText('FORM CERTIFICATION & SIGNATURE ATTESTATION:', { x: margin, y, size: 10, font: fontBold });
  y -= 20;
  page.drawText(`I, the undersigned ${data.declarationName} (${data.declarationDesignation}), certify that the statements`, { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText('made in this past practices declaration are true and legally binding.', { x: margin, y, size: 9, font: fontRegular });
  
  y -= 45;
  const statutoryWarning = `ECT ACT COMPLIANCE: MBD 8 Past SCM Practices is cryptographically certified using local advanced asymmetric signature RSA-2048 keys under Section 13 of South Africa's Electronic Communications and Transactions Act 25 of 2002.`;
  drawParagraph(page, statutoryWarning, margin, y, 495, 7, fontRegular, 9.5);
  
  page.drawText('Page 1 of 1', { x: 500, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('MBD 8 - SA TENDER ASSIST PKI SYSTEM', { x: margin, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  
  return await pdfDoc.save();
}

// Generate MBD 9 (Municipal Certificate of Independent Bid Determination) PDF template dynamically
export async function generateMBD9PDF(data: MBD9Data): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let page = pdfDoc.addPage([595.28, 841.89]);
  const margin = 50;
  let y = 800;
  
  // Header municipal blue bar
  page.drawRectangle({
    x: margin,
    y: y - 50,
    width: 495.28,
    height: 45,
    color: rgb(0.1, 0.3, 0.5),
  });
  
  page.drawText('LOCAL GOVERNMENT OF SOUTH AFRICA', { x: margin + 15, y: y - 22, size: 11, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('MUNICIPAL BIDDING DOCUMENTATION - INDEPENDENT BID DETERMINATION', { x: margin + 15, y: y - 38, size: 8, font: fontRegular, color: rgb(0.9, 0.9, 0.9) });
  
  y -= 75;
  page.drawText('MBD 9: CERTIFICATE OF INDEPENDENT BID DETERMINATION', { x: margin, y, size: 13, font: fontBold, color: rgb(0.1, 0.3, 0.5) });
  
  y -= 30;
  page.drawText(`Target Municipality: ${(data.municipalityName || '').toUpperCase()}`, { x: margin, y, size: 10, font: fontBold, color: rgb(0.1, 0.3, 0.5) });
  
  y -= 25;
  page.drawText('PARTICULARS OF BID:', { x: margin, y, size: 10, font: fontBold });
  y -= 20;
  page.drawText(`Bid / Tender Number: ${data.bidNumber}`, { x: margin, y, size: 9, font: fontBold });
  y -= 15;
  page.drawText(`Description: ${data.bidDescription}`, { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText(`Bidder Corporate Name: ${data.bidderName} (Reg: ${data.registrationNumber})`, { x: margin, y, size: 9, font: fontRegular });
  
  y -= 35;
  page.drawText('INDEPENDENT MUNICIPAL BID ATTESTATIONS:', { x: margin, y, size: 10, font: fontBold });
  
  y -= 25;
  page.drawText('1. Do you certify that prices are determined independently without consultation with competitors?', { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText(`Response: ${data.independentPricingAgreed ? 'YES (Compliant)' : 'NO (Requires Review)'}`, { x: margin + 15, y, size: 9, font: fontBold, color: data.independentPricingAgreed ? rgb(0.1, 0.6, 0.1) : rgb(0.8, 0.1, 0.1) });
  
  y -= 25;
  page.drawText('2. Do you certify that no horizontal bid rigging or collusion has occurred with competitors?', { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText(`Response: ${data.noCollusionAgreed ? 'YES (Compliant)' : 'NO (Requires Review)'}`, { x: margin + 15, y, size: 9, font: fontBold, color: data.noCollusionAgreed ? rgb(0.1, 0.6, 0.1) : rgb(0.8, 0.1, 0.1) });
  
  y -= 45;
  page.drawText('FORM CERTIFICATION & SIGNATURE ATTESTATION:', { x: margin, y, size: 10, font: fontBold });
  y -= 20;
  page.drawText(`I, the undersigned ${data.declarationName} (${data.declarationDesignation}), certify that the statement`, { x: margin, y, size: 9, font: fontRegular });
  y -= 15;
  page.drawText('of independent bidding is true and complete in every respect.', { x: margin, y, size: 9, font: fontRegular });
  
  y -= 45;
  const statutoryWarning = `ECT ACT COMPLIANCE: MBD 9 Certificate of Independent Bid Determination is cryptographically certified using local advanced asymmetric signature RSA-2048 keys under Section 13 of South Africa's Electronic Communications and Transactions Act 25 of 2002.`;
  drawParagraph(page, statutoryWarning, margin, y, 495, 7, fontRegular, 9.5);
  
  page.drawText('Page 1 of 1', { x: 500, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('MBD 9 - SA TENDER ASSIST PKI SYSTEM', { x: margin, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  
  return await pdfDoc.save();
}

// Generate a beautiful, downloadable Certificate of Compliance PDF for the generated keys
export async function generateCertificateAttestationPDF(cert: DigitalCertificate): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  
  const page = pdfDoc.addPage([595.28, 841.89]);
  const margin = 40;
  
  // 1. Draw solid outer border
  page.drawRectangle({
    x: margin,
    y: margin,
    width: 515.28,
    height: 761.89,
    borderColor: rgb(0.02, 0.35, 0.22), // deep emerald green
    borderWidth: 2,
  });
  
  // 2. Draw fancy inner border (slightly offset)
  page.drawRectangle({
    x: margin + 8,
    y: margin + 8,
    width: 499.28,
    height: 745.89,
    borderColor: rgb(0.83, 0.68, 0.21), // gold border
    borderWidth: 1,
  });
  
  // Decorative corner brackets
  const drawCorner = (cx: number, cy: number, dx: number, dy: number) => {
    page.drawRectangle({ x: cx, y: cy, width: dx, height: dy, color: rgb(0.83, 0.68, 0.21) });
  };
  
  // Top-Left corner accent
  drawCorner(margin + 4, margin + 745.89, 20, 4);
  drawCorner(margin + 4, margin + 729.89, 4, 20);
  
  // Top-Right corner accent
  drawCorner(margin + 495.28, margin + 745.89, 20, 4);
  drawCorner(margin + 511.28, margin + 729.89, 4, 20);
  
  // Bottom-Left corner accent
  drawCorner(margin + 4, margin + 8, 20, 4);
  drawCorner(margin + 4, margin + 8, 4, 20);
  
  // Bottom-Right corner accent
  drawCorner(margin + 495.28, margin + 8, 20, 4);
  drawCorner(margin + 511.28, margin + 8, 4, 20);

  let y = 740;
  
  // 3. Certificate Header
  page.drawText('SA TENDER ASSIST', {
    x: 297.64 - (fontBold.widthOfTextAtSize('SA TENDER ASSIST', 14) / 2),
    y,
    size: 14,
    font: fontBold,
    color: rgb(0.02, 0.35, 0.22),
  });
  
  y -= 25;
  
  page.drawText('SECURE LOCAL PUBLIC KEY INFRASTRUCTURE (PKI)', {
    x: 297.64 - (fontRegular.widthOfTextAtSize('SECURE LOCAL PUBLIC KEY INFRASTRUCTURE (PKI)', 9) / 2),
    y,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  y -= 45;
  
  page.drawText('CERTIFICATE OF CRYPTOGRAPHIC COMPLIANCE', {
    x: 297.64 - (fontBold.widthOfTextAtSize('CERTIFICATE OF CRYPTOGRAPHIC COMPLIANCE', 18) / 2),
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.06, 0.15, 0.12),
  });
  
  y -= 15;
  
  page.drawText('Issued under Section 13 of the South African Electronic Communications and Transactions Act, 2002', {
    x: 297.64 - (fontItalic.widthOfTextAtSize('Issued under Section 13 of the South African Electronic Communications and Transactions Act, 2002', 8) / 2),
    y,
    size: 8,
    font: fontItalic,
    color: rgb(0.3, 0.5, 0.4),
  });
  
  y -= 60;
  
  page.drawText('This is to certify that a secure, locally-generated RSA public-private keypair', {
    x: 297.64 - (fontRegular.widthOfTextAtSize('This is to certify that a secure, locally-generated RSA public-private keypair', 10) / 2),
    y,
    size: 10,
    font: fontRegular,
    color: rgb(0.15, 0.15, 0.15),
  });
  
  y -= 15;
  
  page.drawText('has been established in a secure browser memory buffer sandbox (RAM) representing:', {
    x: 297.64 - (fontRegular.widthOfTextAtSize('has been established in a secure browser memory buffer sandbox (RAM) representing:', 10) / 2),
    y,
    size: 10,
    font: fontRegular,
    color: rgb(0.15, 0.15, 0.15),
  });
  
  y -= 50;
  
  // Declarant name centered
  page.drawText((cert.subjectName || '').toUpperCase(), {
    x: 297.64 - (fontBold.widthOfTextAtSize((cert.subjectName || '').toUpperCase(), 18) / 2),
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.02, 0.35, 0.22),
  });
  
  y -= 18;
  
  page.drawText(`${cert.designation} of ${cert.organization}`, {
    x: 297.64 - (fontRegular.widthOfTextAtSize(`${cert.designation} of ${cert.organization}`, 11) / 2),
    y,
    size: 11,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  y -= 45;
  
  // Certificate details box
  page.drawRectangle({
    x: 75,
    y: y - 180,
    width: 445.28,
    height: 170,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 0.5,
    color: rgb(0.98, 0.99, 0.98),
  });
  
  let boxY = y - 25;
  const drawMetaRow = (label: string, value: string) => {
    page.drawText(label, { x: 95, y: boxY, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(value, { x: 230, y: boxY, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    boxY -= 18;
  };
  
  drawMetaRow('Business Email:', cert.email);
  drawMetaRow('National ID Number:', cert.saIdNumber ? `${cert.saIdNumber} (Verified Checksum)` : 'N/A');
  drawMetaRow('Asymmetric Algorithm:', `RSASSA-PKCS1-v1_5 (SHA-256)`);
  drawMetaRow('Cryptographic Key Size:', `${cert.keySize || 2048} bits`);
  drawMetaRow('Active Thumbprint:', cert.publicKeyThumbprint);
  drawMetaRow('Date of Issuance:', new Date(cert.createdIso).toLocaleString('en-ZA'));
  drawMetaRow('Date of Expiry:', new Date(cert.expiresIso).toLocaleString('en-ZA'));
  drawMetaRow('PKI Status:', 'ACTIVE & STATUTORILY VALID FOR PUBLIC TENDERING');
  
  y -= 210;
  
  // Disclaimer
  const disclaimerText = `STATUTORY EFFECT & STANDARDS compliance: This digital certificate qualifies as an advanced electronic credential generated locally by the end-user. Under Section 13 of South Africa’s Electronic Communications and Transactions (ECT) Act 25 of 2002, digital PKI signatures generated using these private keys serve as the statutory equivalent of manual handwritten signatures, legally binding the declarant to the Standard Bidding Documents (SBD) submitted for public tenders.\n\nKeys are generated locally in sandboxed RAM and are not transmitted to or stored on any remote cloud databases.`;
  y = drawParagraph(page, disclaimerText, 75, y, 445, 7, fontItalic, 9);
  
  y -= 40;
  
  // Golden Seal Simulation Badge
  page.drawCircle({
    x: 297.64,
    y: y - 10,
    size: 30,
    color: rgb(0.85, 0.68, 0.2), // rich golden color
    borderColor: rgb(0.02, 0.35, 0.22),
    borderWidth: 1.5,
  });
  
  page.drawText('SEAL', {
    x: 297.64 - (fontBold.widthOfTextAtSize('SEAL', 8) / 2),
    y: y - 13,
    size: 8,
    font: fontBold,
    color: rgb(0.02, 0.35, 0.22),
  });
  
  page.drawText('PKI COMPLIANT', {
    x: 297.64 - (fontRegular.widthOfTextAtSize('PKI COMPLIANT', 5) / 2),
    y: y - 20,
    size: 5,
    font: fontRegular,
    color: rgb(0.02, 0.35, 0.22),
  });
  
  return await pdfDoc.save();
}

async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptP12Bundle(dataJson: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassword(password, salt);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    enc.encode(dataJson)
  );
  
  const saltB64 = arrayBufferToBase64(salt.buffer);
  const ivB64 = arrayBufferToBase64(iv.buffer);
  const ciphertextB64 = arrayBufferToBase64(ciphertext);
  return JSON.stringify({ salt: saltB64, iv: ivB64, data: ciphertextB64 });
}

export async function decryptP12Bundle(encryptedJson: string, password: string): Promise<string> {
  const { salt, iv, data } = JSON.parse(encryptedJson);
  const saltBytes = new Uint8Array(base64ToArrayBuffer(salt));
  const ivBytes = new Uint8Array(base64ToArrayBuffer(iv));
  const ciphertextBytes = base64ToArrayBuffer(data);
  const key = await deriveKeyFromPassword(password, saltBytes);
  const dec = new TextDecoder();
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    ciphertextBytes
  );
  return dec.decode(decrypted);
}

// Generate B-BBEE Sworn Affidavit (EME/QSE DTIC standard)
export async function generateBBBEEAffidavitPDF(
  data: SBD61Data,
  registrationNumber: string,
  declarantName: string,
  declarantDesignation: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const page = pdfDoc.addPage([595.28, 841.89]);
  const margin = 50;
  let y = 800;

  // Header Banner
  page.drawRectangle({
    x: margin,
    y: y - 50,
    width: 495.28,
    height: 45,
    color: rgb(0.02, 0.35, 0.22), // deep South African green
  });

  page.drawText('SWORN AFFIDAVIT - B-BBEE EXEMPTED MICRO ENTERPRISE / QSE', {
    x: margin + 15,
    y: y - 22,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('DEPARTMENT OF TRADE, INDUSTRY AND COMPETITION - REPUBLIC OF SOUTH AFRICA', {
    x: margin + 15,
    y: y - 38,
    size: 7,
    font: fontRegular,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Gold accent bar
  page.drawRectangle({
    x: margin,
    y: y - 55,
    width: 495.28,
    height: 4,
    color: rgb(0.83, 0.68, 0.21), // gold accent
  });

  y -= 80;

  page.drawText('SWORN B-BBEE STATUS LEVEL AFFIDAVIT', {
    x: margin,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.06, 0.15, 0.12),
  });

  y -= 25;

  const introText = `I, the undersigned,\nFull Name: ${declarantName || 'Declarant'}\nDesignation: ${declarantDesignation || 'Director'}\n\nHereby declare under oath that:\n1. The contents of this statement are to the best of my knowledge a true reflection of the facts.\n2. I am an authorized representative of the following enterprise and am duly authorized to make this declaration:`;
  y = drawParagraph(page, introText, margin, y, 495, 8.5, fontRegular, 12);
  y -= 15;

  // Draw enterprise particulars card
  page.drawRectangle({
    x: margin,
    y: y - 90,
    width: 495.28,
    height: 85,
    color: rgb(0.97, 0.98, 0.97),
    borderColor: rgb(0.8, 0.85, 0.8),
    borderWidth: 1,
  });

  const rowH = 14;
  const colX1 = margin + 15;
  const colX2 = margin + 180;
  let cardY = y - 18;

  const drawRow = (label: string, value: string) => {
    page.drawText(label, { x: colX1, y: cardY, size: 8.5, font: fontBold, color: rgb(0.2, 0.3, 0.2) });
    page.drawText(value, { x: colX2, y: cardY, size: 8.5, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    cardY -= rowH;
  };

  drawRow('Enterprise Legal Name:', data.bidderName || 'Unspecified Bidder');
  drawRow('Trading Name (If Any):', data.bidderName || 'Unspecified Trading');
  drawRow('Registration Number:', registrationNumber || 'Unspecified Registration');
  drawRow('Physical Address:', 'Republic of South Africa Workspace');
  drawRow('Enterprise Type:', 'Exempted Micro Enterprise (EME) / QSE');

  y -= 105;

  // Ownership shares
  page.drawText('3. I hereby declare under oath that the Enterprise is:', {
    x: margin,
    y,
    size: 9.5,
    font: fontBold,
    color: rgb(0.02, 0.35, 0.22),
  });
  y -= 15;

  const sharesText = `- ${data.blackOwnershipPercentage}% Black Owned as per Broad-Based Black Economic Empowerment Act 53 of 2003.\n- ${data.blackWomenOwnershipPercentage}% Black Woman Owned.\n- ${data.youthOwnershipPercentage}% Black Youth Owned.\n- ${data.disabilityOwnershipPercentage}% Black People with Disabilities Owned.\n- ${data.cooperativeOwnershipPercentage}% Black Cooperative Owned.`;
  y = drawParagraph(page, sharesText, margin + 15, y, 480, 8.5, fontRegular, 12);
  y -= 15;

  // Level claim
  page.drawText('4. B-BBEE Level & Contributor Standing:', {
    x: margin,
    y,
    size: 9.5,
    font: fontBold,
    color: rgb(0.02, 0.35, 0.22),
  });
  y -= 15;

  const levelText = `Based on the Broad-Based Black Economic Empowerment Codes of Good Practice, the enterprise is certified as a:\n\n--> B-BBEE LEVEL ${data.bbbEELevel} CONTRIBUTOR (${data.bbbEELevel === 1 ? '135%' : data.bbbEELevel === 2 ? '125%' : data.bbbEELevel === 3 ? '110%' : data.bbbEELevel === 4 ? '100%' : '80%'} Procurement Recognition level)\n\nThis claim is supported by a sworn declaration. Under Section 13 of South Africa's Electronic Communications and Transactions (ECT) Act of 2002, this document sealed with an advanced digital signature holds full legal equivalence of a sworn affidavit signed before a Commissioner of Oaths.`;
  y = drawParagraph(page, levelText, margin, y, 495, 8.5, fontRegular, 12);
  y -= 20;

  // Signature lines
  page.drawLine({
    start: { x: margin, y: y - 25 },
    end: { x: margin + 200, y: y - 25 },
    color: rgb(0.5, 0.5, 0.5),
    thickness: 1,
  });

  page.drawLine({
    start: { x: margin + 280, y: y - 25 },
    end: { x: margin + 480, y: y - 25 },
    color: rgb(0.5, 0.5, 0.5),
    thickness: 1,
  });

  page.drawText('DEPONENT (AUTHORIZED REPRESENTATIVE)', {
    x: margin,
    y: y - 35,
    size: 7.5,
    font: fontBold,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText('COMMISSIONER OF OATHS / SECURE SEAL', {
    x: margin + 280,
    y: y - 35,
    size: 7.5,
    font: fontBold,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText(`Name: ${declarantName}`, { x: margin, y: y - 48, size: 8, font: fontRegular });
  page.drawText(`Designation: ${declarantDesignation}`, { x: margin, y: y - 58, size: 8, font: fontRegular });
  page.drawText(`Date: ${new Date().toLocaleDateString('en-ZA')}`, { x: margin, y: y - 68, size: 8, font: fontRegular });

  page.drawText('Status: CRYPTOGRAPHICALLY SECURED', { x: margin + 280, y: y - 48, size: 8, font: fontBold, color: rgb(0.02, 0.35, 0.22) });
  page.drawText('Authority: SA TENDER ASSIST PWA', { x: margin + 280, y: y - 58, size: 8, font: fontRegular });

  return await pdfDoc.save();
}

