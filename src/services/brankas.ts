import axios from 'axios';
import { Platform } from 'react-native';

// When testing on physical devices, localhost won't work.
// Use your computer's local IP address, e.g., 'http://192.168.1.100:8000'
const BACKEND_URL = 'http://192.168.100.143:8000';

export const createStatementLink = async () => {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/create_statement_link`);
    return response.data; // Should return { statement_id, redirect_uri }
  } catch (error) {
    console.error('Error creating statement link:', error);
    throw error;
  }
};

export const getAccounts = async (statementId: string) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/get_accounts`, {
      statement_id: statementId,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw error;
  }
};
