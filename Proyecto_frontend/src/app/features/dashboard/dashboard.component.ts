import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ProductoService } from '../../core/services/producto.service';
import { AuthService } from '../../core/services/auth.service';
import { Producto } from '../../shared/interfaces/producto.interface';
import { Router } from '@angular/router';

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
    productos: Producto[] = [];
    categorias = ['Electrónica', 'Hogar', 'Oficina'];

    productoForm: FormGroup;
    editingId: string | null = null;

    cargando = false;
    error: string | null = null;

    constructor(
        private productoService: ProductoService,
        private authService: AuthService,
        private fb: FormBuilder,
        private router: Router
    ) {
        this.productoForm = this.fb.group({
            nombre: ['', Validators.required],
            codigo_sku: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}-\d{4}$/)]],
            categoria: ['', Validators.required],
            precio: [0, [Validators.required, Validators.min(0)]],
            stock: [0, [Validators.required, Validators.min(0)]]
        });
    }

    ngOnInit(): void {
        this.cargarProductos();
    }

    cargarProductos(): void {
        this.cargando = true;
        this.error = null;
        this.productoService.getProductos().subscribe({
            next: (res) => {
                this.productos = res.productos;
                this.cargando = false;
            },
            error: (err) => {
                this.error = err.error?.mensaje || 'Error al cargar productos';
                this.cargando = false;
            }
        });
    }

    onSubmit(): void {
        if (this.productoForm.invalid) {
            this.productoForm.markAllAsTouched();
            return;
        }

        const producto: Producto = this.productoForm.value;

        const request = this.editingId
            ? this.productoService.actualizarProducto(this.editingId, producto)
            : this.productoService.crearProducto(producto);

        request.subscribe({
            next: () => {
                this.resetForm();
                this.cargarProductos();
            },
            error: (err) => {
                this.error = err.error?.mensaje || 'Error al guardar producto';
            }
        });
    }

    onEdit(producto: Producto): void {
        this.editingId = producto._id ?? null;
        this.productoForm.setValue({
            nombre: producto.nombre,
            codigo_sku: producto.codigo_sku,
            categoria: producto.categoria,
            precio: producto.precio,
            stock: producto.stock
        });
    }

    onDelete(producto: Producto): void {
        if (!producto._id) {
            return;
        }
        if (!confirm(`¿Eliminar "${producto.nombre}"?`)) {
            return;
        }
        this.productoService.eliminarProducto(producto._id).subscribe({
            next: () => this.cargarProductos(),
            error: (err) => {
                this.error = err.error?.mensaje || 'Error al eliminar producto';
            }
        });
    }

    cancelarEdicion(): void {
        this.resetForm();
    }

    private resetForm(): void {
        this.editingId = null;
        this.productoForm.reset({
            nombre: '',
            codigo_sku: '',
            categoria: '',
            precio: 0,
            stock: 0
        });
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
