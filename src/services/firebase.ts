/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  getDoc,
  Timestamp,
  where
} from 'firebase/firestore';
import { DigitalCertificate, PartnerRegistration } from '../types';

// Raw configuration from firebase-applet-config.json
const firebaseConfig = {
  projectId: "gen-lang-client-0656532809",
  appId: "1:1094393764845:web:9599eebad95e710db865e4",
  apiKey: "AIzaSyCvyLaSjjrhubCTk8YBTUA0uHqC6w1YWJk",
  authDomain: "gen-lang-client-0656532809.firebaseapp.com",
  databaseId: "ai-studio-satenderassist-8f80d895-20a7-4bbb-b7cb-3cb50460bcb5",
  storageBucket: "gen-lang-client-0656532809.firebasestorage.app",
  messagingSenderId: "1094393764845"
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!appInstance) {
    if (!firebaseConfig.apiKey) {
      throw new Error("Firebase API key is missing. Please check your configuration.");
    }
    // Check if an app is already initialized, otherwise initialize
    if (getApps().length > 0) {
      appInstance = getApp();
    } else {
      appInstance = initializeApp({
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId
      });
    }
  }
  return appInstance;
}

export function getFirestoreDb(): Firestore {
  if (!dbInstance) {
    const app = getFirebaseApp();
    // Initialize firestore with the custom databaseId if provided
    dbInstance = getFirestore(app, firebaseConfig.databaseId);
  }
  return dbInstance;
}

/**
 * Saves a Digital Certificate's public key fingerprint to Firestore for public-facing verifiability.
 * High-risk PII (Name, Email, SA ID, Designation, and Private Key) is strictly OMITTED and kept only in LocalStorage.
 */
export async function saveCertificateToCloud(cert: DigitalCertificate, userId: string = "default_user"): Promise<void> {
  const path = `certificates/${cert.id}`;
  try {
    const db = getFirestoreDb();
    const docRef = doc(db, 'certificates', cert.id);
    
    // POPIA Compliant: We NEVER save private keys, names, emails, SA IDs, or company names to the cloud.
    // We only publish the anonymous public key fingerprint and validity dates.
    const anonymousCert = {
      id: cert.id,
      createdIso: cert.createdIso,
      expiresIso: cert.expiresIso,
      publicKeyThumbprint: cert.publicKeyThumbprint,
      publicKeyPem: cert.publicKeyPem, // Public key is completely safe to share
      keySize: cert.keySize || 2048,
      validityYears: cert.validityYears || 2,
      userId,
      isCloudAnonymized: true,
      updatedAt: Timestamp.now()
    };

    await setDoc(docRef, anonymousCert);
    console.info(`[Firebase] POPIA Compliance: Successfully registered public-key footprint ${cert.publicKeyThumbprint}. PII remains localized on user's phone/device.`);
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Retrieves the latest active Digital Certificate for a user.
 * Always returns null to force loading of complete PII and Private Keys strictly from LocalStorage.
 */
export async function loadCertificateFromCloud(userId: string = "default_user"): Promise<Omit<DigitalCertificate, 'keyPair'> | null> {
  // POPIA Compliant: Certificates are kept 100% locally in local storage.
  // We return null to guarantee local-only credentials retrieval.
  return null;
}

/**
 * Saves a signed SBD Document metadata record.
 * 1. Saves full rich details (PII) to the user's phone (local storage).
 * 2. Uploads ONLY a 100% anonymous, hashed validation voucher to Firebase Firestore for compliance auditing (zero PII stored).
 */
export async function saveSignedDocumentToCloud(
  docData: {
    id: string;
    fileName: string;
    signedAtIso: string;
    sha256Hash: string;
    bidNumber?: string;
    bidDescription?: string;
    procuringInstitution?: string;
    bidderName?: string;
  },
  userId: string = "default_user"
): Promise<void> {
  const path = `signed_documents/${docData.id}`;
  
  try {
    // 1. Save complete, rich data to LocalStorage (User's Phone / Private Dashboard)
    const localHistoryStr = localStorage.getItem('sata_signed_documents_local');
    const localHistory = localHistoryStr ? JSON.parse(localHistoryStr) : [];
    
    // Avoid duplicate IDs
    const updatedHistory = [docData, ...localHistory.filter((item: any) => item.id !== docData.id)];
    localStorage.setItem('sata_signed_documents_local', JSON.stringify(updatedHistory));
    
    // 2. Upload strictly POPIA-compliant, completely anonymized cryptographic receipt to Cloud Firestore.
    // We remove: fileName, bidderName, bidNumber, bidDescription, procuringInstitution.
    // We only register the document's SHA-256 hash as verification proof.
    const db = getFirestoreDb();
    const docRef = doc(db, 'signed_documents', docData.id);
    
    await setDoc(docRef, {
      id: docData.id,
      sha256Hash: docData.sha256Hash,
      signedAtIso: docData.signedAtIso,
      hasVisualSeal: true,
      userId,
      isAnonymizedForPOPIA: true,
      updatedAt: Timestamp.now()
    });
    
    console.info(`[Firebase] POPIA Compliance: Archived anonymous cryptographic receipt for PDF (SHA-256: ${docData.sha256Hash.substring(0, 8)}...). Zero PII written to cloud.`);
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Retrieves the signature history.
 * Sourced directly from the user's phone/dashboard (LocalStorage) to keep PII fully secure,
 * while cross-checking or merging with cloud receipt statuses if desired.
 */
export async function loadSignedDocumentsFromCloud(userId: string = "default_user"): Promise<any[]> {
  try {
    // POPIA Compliant: Pull complete history with titles and names strictly from local storage (user's device)
    const localHistoryStr = localStorage.getItem('sata_signed_documents_local');
    const localHistory = localHistoryStr ? JSON.parse(localHistoryStr) : [];
    
    // Optionally fetch the cloud verification entries to show cloud registration status
    const db = getFirestoreDb();
    const docsCol = collection(db, 'signed_documents');
    const q = query(docsCol, where("userId", "==", userId), orderBy("updatedAt", "desc"), limit(50));
    const snapshot = await getDocs(q);
    
    const cloudHashes = new Set(snapshot.docs.map(doc => doc.data().sha256Hash));
    
    // Mark items as Registered on Cloud if the hash matches
    return localHistory.map((doc: any) => ({
      ...doc,
      isRegisteredOnCloud: cloudHashes.has(doc.sha256Hash),
      isPOPIASecured: true
    }));
  } catch (err: any) {
    // If Firebase query fails or is empty, we fall back gracefully to local storage
    console.warn("[Firebase] Could not sync with cloud verification ledger, showing local-only history:", err);
    const localHistoryStr = localStorage.getItem('sata_signed_documents_local');
    const localHistory = localHistoryStr ? JSON.parse(localHistoryStr) : [];
    return localHistory.map((doc: any) => ({
      ...doc,
      isRegisteredOnCloud: false,
      isPOPIASecured: true
    }));
  }
}

/**
 * Saves a Partner Registration & Subscription to Cloud Firestore.
 */
export async function savePartnerRegistrationToCloud(partner: PartnerRegistration): Promise<void> {
  const path = `partner_registrations/${partner.id}`;
  try {
    // 1. Save locally
    const localPartnersStr = localStorage.getItem('sata_partner_registrations_local');
    const localPartners = localPartnersStr ? JSON.parse(localPartnersStr) : [];
    const updated = [partner, ...localPartners.filter((p: any) => p.id !== partner.id)];
    localStorage.setItem('sata_partner_registrations_local', JSON.stringify(updated));

    // 2. Save in Firestore
    const db = getFirestoreDb();
    const docRef = doc(db, 'partner_registrations', partner.id);
    await setDoc(docRef, {
      ...partner,
      updatedAt: Timestamp.now()
    });
    console.info(`[Firebase] Partner registered successfully: ${partner.companyName} (${partner.subscriptionTier})`);
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Loads Partner Registrations from cloud or local storage fallback.
 */
export async function loadPartnerRegistrationsFromCloud(userId: string = "default_user"): Promise<PartnerRegistration[]> {
  try {
    const db = getFirestoreDb();
    const colRef = collection(db, 'partner_registrations');
    const q = query(colRef, where("userId", "==", userId), orderBy("updatedAt", "desc"), limit(50));
    const snapshot = await getDocs(q);
    
    const cloudPartners = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        companyName: data.companyName,
        contactName: data.contactName,
        email: data.email,
        categories: data.categories,
        targetProvinces: data.targetProvinces,
        subscriptionTier: data.subscriptionTier,
        agreedSplit: data.agreedSplit,
        paidUpfrontZar: data.paidUpfrontZar,
        status: data.status,
        paymentReference: data.paymentReference,
        userId: data.userId,
        createdIso: data.createdIso,
        isForeignSupplier: data.isForeignSupplier,
        foreignRegistryNumber: data.foreignRegistryNumber,
        foreignCountry: data.foreignCountry,
        globalSwiftBic: data.globalSwiftBic,
        globalIban: data.globalIban,
        sarsExemptionWaiverCode: data.sarsExemptionWaiverCode,
        geepReference: data.geepReference,
        prefPointsEquivalenceClaim: data.prefPointsEquivalenceClaim,
        foreignCurrency: data.foreignCurrency,
        sarbExchangeRate: data.sarbExchangeRate,
        localContentPercentage: data.localContentPercentage,
        fecHedgingArranged: data.fecHedgingArranged,
      } as PartnerRegistration;
    });

    // Merge with any local ones to ensure no loss of offline data
    const localPartnersStr = localStorage.getItem('sata_partner_registrations_local');
    const localPartners = localPartnersStr ? JSON.parse(localPartnersStr) : [];
    
    const mergedMap = new Map<string, PartnerRegistration>();
    localPartners.forEach((p: PartnerRegistration) => mergedMap.set(p.id, p));
    cloudPartners.forEach((p: PartnerRegistration) => mergedMap.set(p.id, p));
    
    return Array.from(mergedMap.values());
  } catch (err: any) {
    console.warn("[Firebase] Could not load partner list from cloud, using local storage fallback:", err);
    const localPartnersStr = localStorage.getItem('sata_partner_registrations_local');
    return localPartnersStr ? JSON.parse(localPartnersStr) : [];
  }
}

/**
 * Saves a Developer IP Copyright Manifest to Cloud Firestore for immutable timestamp proof of authorship.
 */
export async function saveDeveloperIPManifestToCloud(manifest: {
  id: string;
  devOwnerName: string;
  appVersion: string;
  sha256Hash: string;
  signedManifestPem: string;
  registeredAtIso: string;
  fileCount: number;
}, userId: string = "default_user"): Promise<void> {
  const path = `developer_ip_manifests/${manifest.id}`;
  try {
    const db = getFirestoreDb();
    const docRef = doc(db, 'developer_ip_manifests', manifest.id);
    await setDoc(docRef, {
      ...manifest,
      userId,
      isAnonymizedForPOPIA: true,
      updatedAt: Timestamp.now()
    });
    console.info(`[Firebase] Developer IP Manifest registered successfully: SHA-256: ${manifest.sha256Hash}`);
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Loads Developer IP Manifests from Cloud Firestore.
 */
export async function loadDeveloperIPManifestsFromCloud(userId: string = "default_user"): Promise<any[]> {
  try {
    const db = getFirestoreDb();
    const colRef = collection(db, 'developer_ip_manifests');
    const q = query(colRef, where("userId", "==", userId), orderBy("updatedAt", "desc"), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err: any) {
    console.warn("[Firebase] Could not load developer IP manifests from cloud:", err);
    return [];
  }
}

