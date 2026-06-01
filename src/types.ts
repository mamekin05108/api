/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ResponseCode = 200 | 404 | 500;

export interface SimulationConfig {
  shopId: string;
  customerId: string;
  responseCode: ResponseCode;
  customResponseText: string;
  networkLatency: number; // in ms
}

export interface PayloadLog {
  reactRequest: any;
  drfRequest: any;
  externalResponse: any;
  finalResponse: any;
  status: 'idle' | 'sending' | 'drf_processing' | 'external_calling' | 'done' | 'error';
  errorMessage?: string;
}

export type CodeTab = 'drf' | 'react';
export type InspectorTab = 'payload' | 'logs';
