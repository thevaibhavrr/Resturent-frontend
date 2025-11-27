import { makeApi } from './makeapi';

export const checkUsername = async (username: string, excludeId?: string) => {
    const params = new URLSearchParams({ username });
    if (excludeId) {
        params.append('excludeId', excludeId);
    }
    const response = await makeApi(`/api/staff/check-username?${params}`, 'GET');
    return response.data;
};

export const getAllStaff = async () => {
    const response = await makeApi('/api/staff', 'GET');
    return response.data;
};

export const getStaffByRestaurant = async (restaurantId: string) => {
    const response = await makeApi(`/api/staff/restaurant/${restaurantId}`, 'GET');
    return response.data;
};

export const createStaff = async (staffData) => {
    const response = await makeApi('/api/staff', 'POST', staffData);
    return response.data;
};

export const getStaffById = async (id) => {
    const response = await makeApi(`/api/staff/${id}`, 'GET');
    return response.data;
};

export const updateStaff = async (id, staffData) => {
    const response = await makeApi(`/api/staff/${id}`, 'PUT', staffData);
    return response.data;
};

export const deleteStaff = async (id) => {
    const response = await makeApi(`/api/staff/${id}`, 'DELETE');
    return response.data;
};