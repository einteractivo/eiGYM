import api from './api';

export interface Member {
    id: number;
    firstName: string;
    lastName: string;
    dni: string;
    phone?: string;
    email?: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface ChurnRiskMember {
    id: number;
    firstName: string;
    lastName: string;
    dni: string;
    phone?: string;
    email?: string;
    photoUrl?: string;
    status: string;
    lastAttendanceDate: string | null;
    daysSinceLastAttendance: number | null;
    membershipEndDate: string | null;
    daysToExpiration: number | null;
    planName: string;
    riskLevel: 'MEDIUM' | 'HIGH';
    riskReason: string;
    riskScore: number;
}

const MemberService = {
    getAll: async (search: string = ''): Promise<Member[]> => {
        const response = await api.get(`/members?search=${search}`);
        return response.data;
    },
    getById: async (id: number): Promise<Member> => {
        const response = await api.get(`/members/${id}`);
        return response.data;
    },
    getChurnRisk: async (): Promise<ChurnRiskMember[]> => {
        const response = await api.get('/members/churn-risk');
        return response.data;
    }
};

export default MemberService;
