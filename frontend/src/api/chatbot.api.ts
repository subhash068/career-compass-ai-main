import axiosClient from './axiosClient';
import { ChatMessage } from '@/types';

export interface ChatQueryRequest {
  message: string;
  session_id?: string;
}

export interface ChatQueryResponse {
  message: ChatMessage;
  session_id: string;
}

export const chatbotApi = {
  sendQuery: async (data: ChatQueryRequest): Promise<ChatQueryResponse> => {
    const response = await axiosClient.post<ChatQueryResponse>('/chatbot/message', data);
    return response.data;
  },

};
