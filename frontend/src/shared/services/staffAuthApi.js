import axios from './axios';

export const staffAuthApi = {
  login: (credentials) => 
    axios.post('/portal/staff/auth/login/', credentials),
};

export default staffAuthApi;
