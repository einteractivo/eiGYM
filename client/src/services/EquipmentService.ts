import api from './api';

export interface Equipment {
    id: number;
    name: string;
    description: string | null;
    status: 'OPERATIONAL' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
    location: string | null;
    purchaseDate: string | null;
    lastMaintenance: string | null;
    notes: string | null;
    photoUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

const EquipmentService = {
    getAllEquipment: async (search?: string, status?: string) => {
        const response = await api.get('/equipment', {
            params: { search, status }
        });
        return response.data as Equipment[];
    },

    getEquipmentById: async (id: number) => {
        const response = await api.get(`/equipment/${id}`);
        return response.data as Equipment;
    },

    createEquipment: async (data: Partial<Equipment>) => {
        const response = await api.post('/equipment', data);
        return response.data as Equipment;
    },

    updateEquipment: async (id: number, data: Partial<Equipment>) => {
        const response = await api.put(`/equipment/${id}`, data);
        return response.data as Equipment;
    },

    deleteEquipment: async (id: number) => {
        const response = await api.delete(`/equipment/${id}`);
        return response.data;
    }
};

export default EquipmentService;
