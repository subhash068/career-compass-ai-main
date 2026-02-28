import axiosClient from './axiosClient';
import type { Certificate, OpenBadgeAssertion, OpenBadgeResponse, OpenBadgePackage } from '@/types';

export const certificateApi = {
  getUserCertificates: async (): Promise<{ certificates: Certificate[]; count: number }> => {
    const response = await axiosClient.get('/certificate/user');
    return response.data;
  },

  getCertificate: async (certificateId: number): Promise<Certificate> => {
    const response = await axiosClient.get(`/certificate/${certificateId}`);
    return response.data;
  },

  generateCertificate: async (pathId: number): Promise<{ message: string; certificate: Certificate }> => {
    const response = await axiosClient.post(`/certificate/generate/${pathId}`);
    return response.data;
  },

  getCertificateForPath: async (pathId: number): Promise<{ exists: boolean; certificate: Certificate | null }> => {
    const response = await axiosClient.get(`/certificate/path/${pathId}`);
    return response.data;
  },

  regenerateQRCode: async (certificateId: number): Promise<{ message: string; qr_code: boolean; certificate: Certificate }> => {
    const response = await axiosClient.post(`/certificate/regenerate-qr/${certificateId}`);
    return response.data;
  },

  // Open Badge 2.0 Methods
  getIssuerMetadata: async (): Promise<any> => {
    const response = await axiosClient.get('/certificate/.well-known/issuer.json');
    return response.data;
  },

  getBadgeClass: async (roleTitle: string): Promise<any> => {
    const response = await axiosClient.get(`/certificate/badge/${encodeURIComponent(roleTitle)}`);
    return response.data;
  },

  getAssertion: async (certificateId: string): Promise<OpenBadgeAssertion> => {
    const response = await axiosClient.get(`/certificate/assertions/${certificateId}`);
    return response.data;
  },

  getOpenBadgePackage: async (certificateId: number): Promise<OpenBadgeResponse> => {
    const response = await axiosClient.get(`/certificate/openbadge/${certificateId}`);
    return response.data;
  },

  downloadOpenBadgeJson: async (certificateId: number): Promise<OpenBadgeAssertion> => {
    const response = await axiosClient.get(`/certificate/openbadge/${certificateId}/download`);
    return response.data;
  },

  anchorToBlockchain: async (certificateId: number, network: string = 'sepolia'): Promise<any> => {
    const response = await axiosClient.post(`/certificate/anchor/${certificateId}?network=${network}`);
    return response.data;
  },

  verifyOnBlockchain: async (certificateId: string, network: string = 'sepolia'): Promise<any> => {
    const response = await axiosClient.post(`/certificate/verify-blockchain/${certificateId}?network=${network}`);
    return response.data;
  },
};
