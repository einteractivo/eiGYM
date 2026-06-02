import api from './api';

export interface Product {
    id: number;
    name: string;
    description: string | null;
    costPrice: number;
    price: number;
    stock: number;
    photoUrl: string | null;
    active: boolean;
}

export interface SaleItem {
    productId: number;
    quantity: number;
    price: number;
}

export interface SaleRequest {
    memberId: number | null;
    items: SaleItem[];
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'YAPE' | 'PLIN';
    total: number;
    notes?: string;
}

const ProductService = {
    getAllProducts: async (search?: string, activeOnly: boolean = true) => {
        const response = await api.get('/products', {
            params: { search, activeOnly }
        });
        return response.data as Product[];
    },

    getProductById: async (id: number) => {
        const response = await api.get(`/products/${id}`);
        return response.data as Product;
    },

    createProduct: async (data: Partial<Product>) => {
        const response = await api.post('/products', data);
        return response.data as Product;
    },

    updateProduct: async (id: number, data: Partial<Product>) => {
        const response = await api.put(`/products/${id}`, data);
        return response.data as Product;
    },

    deleteProduct: async (id: number) => {
        const response = await api.delete(`/products/${id}`);
        return response.data;
    },

    createSale: async (data: SaleRequest) => {
        const response = await api.post('/sales', data);
        return response.data;
    },

    getAllSales: async () => {
        const response = await api.get('/sales');
        return response.data;
    }
};

export default ProductService;
