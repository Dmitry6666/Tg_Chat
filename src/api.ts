import type { AuthData, CheckAccountResponse } from './types';

const API_URL = 'https://api.green-api.com';

export const sendMessage = async (
  { idInstance, apiTokenInstance }: AuthData,
  chatId: string,
  message: string
) => {
  const response = await fetch(
    `${API_URL}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message }),
    }
  );
  return response.json();
};

export const receiveNotification = async (
  { idInstance, apiTokenInstance }: AuthData
) => {
  const response = await fetch(
    `${API_URL}/waInstance${idInstance}/receiveNotification/${apiTokenInstance}`
  );
  return response.json();
};

export const deleteNotification = async (
  { idInstance, apiTokenInstance }: AuthData,
  receiptId: number
) => {
  await fetch(
    `${API_URL}/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${receiptId}`,
    { method: 'DELETE' }
  );
};

// Проверка номера телефона и получение реального chatId
export const checkAccount = async (
  { idInstance, apiTokenInstance }: AuthData,
  phoneNumber: string
): Promise<CheckAccountResponse> => {
  const response = await fetch(
    `${API_URL}/waInstance${idInstance}/checkAccount/${apiTokenInstance}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: Number(phoneNumber) }),
    }
  );
  return response.json();
};