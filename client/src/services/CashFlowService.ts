import api from './api';

export interface CashTransaction {
    id: number;
    sessionId: number;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    description?: string;
    status: 'COMPLETED' | 'VOIDED';
    createdAt: string;
}

export interface CashSession {
    id: number;
    userId: number;
    openedAt: string;
    closedAt?: string;
    initialAmount: number;
    finalAmount?: number;
    expectedAmount?: number;
    status: 'OPEN' | 'CLOSED';
    notes?: string;
    user?: { name: string };
    transactions?: CashTransaction[];
    payments?: any[];
    summary?: {
        totalPayments: number;
        totalManualIncome: number;
        totalManualExpense: number;
        expectedAmount: number;
    };
}

const CashFlowService = {
    openSession: async (data: { userId: number; initialAmount: number; notes?: string }) => {
        const response = await api.post<CashSession>('/cash-flow/open', data);
        return response.data;
    },

    getCurrentSession: async () => {
        const response = await api.get<CashSession>('/cash-flow/current');
        return response.data;
    },

    closeSession: async (id: number, data: { finalAmount: number; notes?: string }) => {
        const response = await api.put<CashSession>(`/cash-flow/close/${id}`, data);
        return response.data;
    },

    addTransaction: async (data: {
        sessionId: number;
        amount: number;
        type: 'INCOME' | 'EXPENSE';
        category: string;
        description?: string;
    }) => {
        const response = await api.post<CashTransaction>('/cash-flow/transaction', data);
        return response.data;
    },

    getHistory: async () => {
        const response = await api.get<CashSession[]>('/cash-flow/history');
        return response.data;
    },

    getSessionDetails: async (id: number) => {
        const response = await api.get<CashSession>(`/cash-flow/${id}`);
        return response.data;
    },

    getAllTransactions: async (type?: 'INCOME' | 'EXPENSE') => {
        const response = await api.get<CashTransaction[]>('/cash-flow/transactions', {
            params: { type }
        });
        return response.data;
    },

    voidTransaction: async (id: number) => {
        const response = await api.put<CashTransaction>(`/cash-flow/transaction/void/${id}`);
        return response.data;
    },

    deleteTransaction: async (id: number) => {
        const response = await api.delete<{ message: string }>(`/cash-flow/transaction/${id}`);
        return response.data;
    }
};

export default CashFlowService;
