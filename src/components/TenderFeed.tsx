/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import TenderFeedExplorer from './TenderFeedExplorer';

interface TenderFeedProps {
  onSelectTender: (
    tender: {
      referenceNumber: string;
      title: string;
      procuringInstitution: string;
    },
    targetTab: 'advisor' | 'filler'
  ) => void;
  addLog?: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function TenderFeed({ onSelectTender, addLog }: TenderFeedProps) {
  const handleSelectTender = (tender: any, targetAction: 'SBD4' | 'SBD61' | 'ADVISOR') => {
    const mappedTab = targetAction === 'ADVISOR' ? 'advisor' : 'filler';
    onSelectTender({
      referenceNumber: tender.referenceNumber,
      title: tender.title,
      procuringInstitution: tender.department || (tender.province ? tender.province.replace('_', ' ').toUpperCase() + ' TREASURY' : 'NATIONAL TREASURY')
    }, mappedTab);
  };

  return (
    <TenderFeedExplorer 
      onSelectTender={handleSelectTender} 
      addLog={addLog}
    />
  );
}
