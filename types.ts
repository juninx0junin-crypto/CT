
export enum ComandaStatus {
  OPEN = 'ABERTA',
  CLOSED = 'FECHADA'
}

export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface ComandaItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Comanda {
  id: string;
  customerName: string;
  createdAt: string;
  closedAt?: string;
  status: ComandaStatus;
  items: ComandaItem[];
  total: number;
}

export interface DailyReport {
  date: string;
  totalSales: number;
  ordersCount: number;
}
