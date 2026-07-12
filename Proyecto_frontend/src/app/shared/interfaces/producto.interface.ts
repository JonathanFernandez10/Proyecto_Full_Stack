export interface Producto {
    _id?: string;
    nombre: string;
    codigo_sku: string;
    categoria: 'Electrónica' | 'Hogar' | 'Oficina';
    precio: number;
    stock: number;
    createdAt?: string;
    updatedAt?: string;
}
