
import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Água Mineral 500ml', price: 4.00 },
  { id: '2', name: 'Cerveja Lata 350ml', price: 7.00 },
  { id: '3', name: 'Refrigerante Lata', price: 6.00 },
  { id: '4', name: 'Energético 250ml', price: 12.00 },
  { id: '5', name: 'Suco Natural', price: 9.00 },
  { id: '6', name: 'Espetinho Carne', price: 15.00 },
  { id: '7', name: 'Porção Batata Frita', price: 28.00 },
  { id: '8', name: 'Açaí 500ml', price: 18.00 },
  { id: '9', name: 'Sanduíche Natural', price: 14.00 },
  { id: '10', name: 'Aluguel de Bola', price: 10.00 },
  { id: '11', name: 'Aluguel de Raquete', price: 15.00 },
];

export const STORAGE_KEY = 'quadra_master_comandas';
export const PRODUCTS_KEY = 'quadra_master_products';
