export interface AuthData {
  idInstance: string;
  apiTokenInstance: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  type: 'incoming' | 'outgoing';
  timestamp: number;
}

export interface NotificationBody {
  typeWebhook: string;
  senderData: {
    chatId: string;
    senderName: string;
  };
  messageData: {
    typeMessage: string;
    textMessageData?: {
      textMessage: string;
    };
  };
}

export interface CheckAccountResponse {
  exist: boolean;
  chatId?: string;
}