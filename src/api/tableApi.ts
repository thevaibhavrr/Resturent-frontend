import { makeApi } from './makeapi';

export const getAllTables = async (restaurantId: string) => {
    const response = await makeApi(`/api/table?restaurantId=${restaurantId}`, 'GET');
    return response.data;
};

export const createTable = async (tableData: any) => {
    const response = await makeApi('/api/table', 'POST', tableData);
    return response.data;
};

export const updateTable = async (id: string, tableData: any) => {
    const response = await makeApi(`/api/table/${id}`, 'PUT', tableData);
    return response.data;
};

export const deleteTable = async (id: string) => {
    const response = await makeApi(`/api/table/${id}`, 'DELETE');
    return response.data;
};

export const getTableById = async (id: string) => {
    const response = await makeApi(`/api/table/${id}`, 'GET');
    return response.data;
};

export const setTableInactive = async (id: string) => {
    const response = await makeApi(`/api/table/${id}/inactive`, 'PATCH');
    return response.data;
};
