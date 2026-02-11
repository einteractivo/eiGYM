import api from './api';

export interface GymClass {
    id: number;
    name: string;
    description?: string;
    active: boolean;
    schedules?: Schedule[];
}

export interface Trainer {
    id: number;
    name: string;
    role: string;
}

export interface Schedule {
    id: number;
    classId: number;
    trainerId: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    capacity: number;
    active: boolean;
    gymClass?: GymClass;
    trainer?: Trainer;
}

const GymClassService = {
    // Classes
    getAllClasses: async () => {
        const response = await api.get('/classes');
        return response.data;
    },
    createClass: async (data: Partial<GymClass>) => {
        const response = await api.post('/classes', data);
        return response.data;
    },
    updateClass: async (id: number, data: Partial<GymClass>) => {
        const response = await api.put(`/classes/${id}`, data);
        return response.data;
    },
    deleteClass: async (id: number) => {
        await api.delete(`/classes/${id}`);
    },

    // Schedules
    getAllSchedules: async () => {
        const response = await api.get('/schedules');
        return response.data;
    },
    getTrainers: async () => {
        const response = await api.get('/schedules/trainers');
        return response.data;
    },
    createSchedule: async (data: Partial<Schedule>) => {
        const response = await api.post('/schedules', data);
        return response.data;
    },
    updateSchedule: async (id: number, data: Partial<Schedule>) => {
        const response = await api.put(`/schedules/${id}`, data);
        return response.data;
    },
    deleteSchedule: async (id: number) => {
        await api.delete(`/schedules/${id}`);
    }
};

export default GymClassService;
