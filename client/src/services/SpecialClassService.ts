import api from './api';

export interface SpecialClassRegistration {
    id: number;
    specialClassId: number;
    memberId: number;
    registrationDate: string;
    status: string;
    member?: {
        id: number;
        firstName: string;
        lastName: string;
        dni: string;
    };
}

export interface SpecialClass {
    id: number;
    name: string;
    description?: string;
    price: number;
    schedule?: string;
    dayOfWeek?: number | null;
    startTime?: string | null;
    endTime?: string | null;
    capacity?: number | null;
    color?: string;
    active: boolean;
    createdAt?: string;
    registrations?: SpecialClassRegistration[];
}

export interface EnrollPayload {
    memberId: number;
    paymentMethod: string;
    amount: number;
    type?: string;
}

const SpecialClassService = {
    getAll: async (): Promise<SpecialClass[]> => {
        const response = await api.get('/special-classes');
        return response.data;
    },
    create: async (data: Partial<SpecialClass>): Promise<SpecialClass> => {
        const response = await api.post('/special-classes', data);
        return response.data;
    },
    update: async (id: number, data: Partial<SpecialClass>): Promise<SpecialClass> => {
        const response = await api.put(`/special-classes/${id}`, data);
        return response.data;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/special-classes/${id}`);
    },
    enroll: async (classId: number, payload: EnrollPayload): Promise<any> => {
        const response = await api.post(`/special-classes/${classId}/enroll`, payload);
        return response.data;
    },
    cancelEnrollment: async (classId: number, registrationId: number): Promise<any> => {
        const response = await api.put(`/special-classes/${classId}/enroll/${registrationId}/cancel`);
        return response.data;
    }
};

export default SpecialClassService;
