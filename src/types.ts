/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DigitalCertificate {
  id: string;
  subjectName: string;
  organization: string;
  designation: string;
  email: string;
  createdIso: string;
  expiresIso: string;
  publicKeyThumbprint: string;
  keyPair: CryptoKeyPair;
  publicKeyPem: string;
  privateKeyPem: string;
  saIdNumber?: string;
  keySize?: number;
  validityYears?: number;
}

export interface DirectorDetails {
  id: string;
  fullName: string;
  identityNumber: string;
  stateEmployeeNumber?: string;
}

export interface SBD4Data {
  bidNumber: string;
  bidDescription: string;
  procuringInstitution: string;
  
  bidderName: string;
  registrationNumber: string;
  taxReferenceNumber: string;
  vatNumber: string;
  
  directors: DirectorDetails[];
  
  isEmployedByState: boolean;
  employedByStateParticulars: string;
  
  hasRelationshipWithStateEmployee: boolean;
  relationshipParticulars: string;
  
  isRestrictedSupplier: boolean;
  isTenderDefaulter: boolean;
  
  declarationName: string;
  declarationDesignation: string;
}

export interface SBD61Data {
  bidNumber: string;
  bidderName: string;
  pointsSystem: "80/20" | "90/10";
  bbbEELevel: number; // 1 to 8, or Non-compliant (9)
  blackOwnershipPercentage: number;
  blackWomenOwnershipPercentage: number;
  youthOwnershipPercentage: number;
  disabilityOwnershipPercentage: number;
  cooperativeOwnershipPercentage: number;
}

export interface SignatureResult {
  fileName: string;
  signedAtIso: string;
  sha256Hash: string;
  pdfBytes: Uint8Array;
}

export interface VerificationResult {
  isValid: boolean;
  fileName: string;
  fileSize: number;
  sha256Hash: string;
  hasVisualSeal: boolean;
  sealDetails?: {
    signedBy: string;
    organization: string;
    timestamp: string;
    compliantAct: string;
  };
  errors: string[];
}

export interface PartnerRegistration {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  categories: string;
  targetProvinces: string;
  subscriptionTier: string;
  agreedSplit: number;
  paidUpfrontZar: number;
  status: 'pending' | 'active' | 'suspended';
  paymentReference: string;
  userId: string;
  createdIso: string;
  // Non-SA / Foreign Supplier compliance features
  isForeignSupplier?: boolean;
  foreignRegistryNumber?: string;
  foreignCountry?: string;
  globalSwiftBic?: string;
  globalIban?: string;
  sarsExemptionWaiverCode?: string;
  geepReference?: string;
  prefPointsEquivalenceClaim?: 'none' | 'geep' | 'zero_rating';
  foreignCurrency?: string;
  sarbExchangeRate?: number;
  localContentPercentage?: number;
  fecHedgingArranged?: boolean;
  isJvConsortium?: boolean;
  jvLocalPartnerName?: string;
  jvLocalPartnerShare?: number;
  jvLocalPartnerBbeeLevel?: number;
  consolidatedJvBbeeLevel?: number;
}

export interface SBD8Data {
  bidNumber: string;
  bidDescription: string;
  procuringInstitution: string;
  bidderName: string;
  registrationNumber: string;
  isRestrictedSupplier: boolean;
  hasConvictionFraud: boolean;
  hasFailedContract: boolean;
  declarationName: string;
  declarationDesignation: string;
}

export interface SBD9Data {
  bidNumber: string;
  bidDescription: string;
  procuringInstitution: string;
  bidderName: string;
  registrationNumber: string;
  independentPricingAgreed: boolean;
  noCollusionAgreed: boolean;
  hasConsultedCompetitor: boolean;
  consultationDetails?: string;
  declarationName: string;
  declarationDesignation: string;
}

export interface MBD4Data {
  bidNumber: string;
  bidDescription: string;
  municipalityName: string;
  bidderName: string;
  registrationNumber: string;
  taxReferenceNumber: string;
  vatNumber: string;
  directors: DirectorDetails[];
  isEmployedByState: boolean;
  employedByStateParticulars: string;
  declarationName: string;
  declarationDesignation: string;
}

export interface MBD8Data {
  bidNumber: string;
  bidDescription: string;
  municipalityName: string;
  bidderName: string;
  registrationNumber: string;
  isRestrictedSupplier: boolean;
  hasConvictionFraud: boolean;
  hasFailedContract: boolean;
  declarationName: string;
  declarationDesignation: string;
}

export interface MBD9Data {
  bidNumber: string;
  bidDescription: string;
  municipalityName: string;
  bidderName: string;
  registrationNumber: string;
  independentPricingAgreed: boolean;
  noCollusionAgreed: boolean;
  declarationName: string;
  declarationDesignation: string;
}
