
import api from './api';

export interface TrainerAttendance {
    id: number;
    trainerId: number;
    gymId: number;
    scheduleId?: number;
    checkIn: string;
    checkOut?: string;
    status: 'PRESENT' | 'LATE' | 'ABSENT';
    notes?: string;
    trainer?: {
        name: string;
        email: string;
    };
    schedule?: {
        startTime: string;
        endTime: string;
        gymClass: {
            name: string;
        };
    };
}

const TrainerAttendanceService = {
    registerAttendance: async (data: { trainerId: number; action: 'CHECK_IN' | 'CHECK_OUT'; notes?: string }) => {
        const response = await api.post('/trainer-attendance/register', data);
        return response.data;
    },
    getHistory: async (params?: { trainerId?: number; startDate?: string; endDate?: string }) => {
        const response = await api.get('/trainer-attendance/history', { params });
        return response.data;
    },
    getStats: async (params?: { trainerId?: number; month?: number; year?: number }) => {
        const response = await api.get('/trainer-attendance/stats', { params });
        return response.data;
    }
};

export default TrainerAttendanceService;
