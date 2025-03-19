// This is a simplified version of the Supabase types
// You should generate this file using the Supabase CLI for a complete type definition

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cotizaciones: {
        Row: {
          cotizacion_id: number
          cliente_id: number
          vendedor_id: number
          fecha_cotizacion: string
          moneda: string
          tipo_cambio: number
          iva: number
          tipo_cuenta: string
          descuento_total: number
          precio_total: number
          tiempo_estimado: string
          estatus: string
          envio: number | null
          monto_broker: number | null
          estatus_pago: string | null
        }
        Insert: {
          cotizacion_id?: number
          cliente_id: number
          vendedor_id: number
          fecha_cotizacion: string
          moneda: string
          tipo_cambio: number
          iva: number
          tipo_cuenta: string
          descuento_total: number
          precio_total: number
          tiempo_estimado: string
          estatus: string
          envio?: number | null
          monto_broker?: number | null
          estatus_pago?: string | null
        }
        Update: {
          cotizacion_id?: number
          cliente_id?: number
          vendedor_id?: number
          fecha_cotizacion?: string
          moneda?: string
          tipo_cambio?: number
          iva?: number
          tipo_cuenta?: string
          descuento_total?: number
          precio_total?: number
          tiempo_estimado?: string
          estatus?: string
          envio?: number | null
          monto_broker?: number | null
          estatus_pago?: string | null
        }
      }
      clientes: {
        Row: {
          cliente_id: number
          nombre: string
          celular: string
          correo: string | null
          razon_social: string | null
          rfc: string | null
          tipo_cliente: string | null
          lead: string | null
          direccion_envio: string | null
          recibe: string | null
          atencion: string | null
        }
        Insert: {
          cliente_id?: number
          nombre: string
          celular: string
          correo?: string | null
          razon_social?: string | null
          rfc?: string | null
          tipo_cliente?: string | null
          lead?: string | null
          direccion_envio?: string | null
          recibe?: string | null
          atencion?: string | null
        }
        Update: {
          cliente_id?: number
          nombre?: string
          celular?: string
          correo?: string | null
          razon_social?: string | null
          rfc?: string | null
          tipo_cliente?: string | null
          lead?: string | null
          direccion_envio?: string | null
          recibe?: string | null
          atencion?: string | null
        }
      }
      productos: {
        Row: {
          producto_id: number
          sku: string | null
          nombre: string
          tipo_ceramica: string | null
          tipo_producto: string | null
          descripcion: string | null
          colores: string | null
          capacidad: number
          unidad: string
          precio: number
          cantidad_inventario: number | null
        }
        Insert: {
          producto_id?: number
          sku?: string | null
          nombre: string
          tipo_ceramica?: string | null
          tipo_producto?: string | null
          descripcion?: string | null
          colores?: string | null
          capacidad: number
          unidad: string
          precio: number
          cantidad_inventario?: number | null
        }
        Update: {
          producto_id?: number
          sku?: string | null
          nombre?: string
          tipo_ceramica?: string | null
          tipo_producto?: string | null
          descripcion?: string | null
          colores?: string | null
          capacidad?: number
          unidad?: string
          precio?: number
          cantidad_inventario?: number | null
        }
      }
      prodsxcotizacion: {
        Row: {
          prodsxc_id: number
          cotizacion_id: number
          producto_id: number
          colores: string | null
          descuento: number
          cantidad: number
          precio_final: number
          acabado: string | null
          descripcion: string | null
          cantidad_etiquetas: number | null
          pu_etiqueta: number | null
        }
        Insert: {
          prodsxc_id?: number
          cotizacion_id: number
          producto_id: number
          colores?: string | null
          descuento: number
          cantidad: number
          precio_final: number
          acabado?: string | null
          descripcion?: string | null
          cantidad_etiquetas?: number | null
          pu_etiqueta?: number | null
        }
        Update: {
          prodsxc_id?: number
          cotizacion_id?: number
          producto_id?: number
          colores?: string | null
          descuento?: number
          cantidad?: number
          precio_final?: number
          acabado?: string | null
          descripcion?: string | null
          cantidad_etiquetas?: number | null
          pu_etiqueta?: number | null
        }
      }
      prodsxcot_temp: {
        Row: {
          prodsxc_id: number
          cotizacion_id: number
          item: number
          cantidad: number
          descuento: number
          precio_final: number
          producto_id: number
          nombre: string | null
          capacidad: number | null
          unidad: string | null
          colores: string | null
          acabado: string | null
          descripcion: string | null
          cantidad_etiquetas: number | null
          pu_etiqueta: number | null
        }
        Insert: {
          prodsxc_id?: number
          cotizacion_id: number
          item: number
          cantidad: number
          descuento: number
          precio_final: number
          producto_id: number
          nombre?: string | null
          capacidad?: number | null
          unidad?: string | null
          colores?: string | null
          acabado?: string | null
          descripcion?: string | null
          cantidad_etiquetas?: number | null
          pu_etiqueta?: number | null
        }
        Update: {
          prodsxc_id?: number
          cotizacion_id?: number
          item?: number
          cantidad?: number
          descuento?: number
          precio_final?: number
          producto_id?: number
          nombre?: string | null
          capacidad?: number | null
          unidad?: string | null
          colores?: string | null
          acabado?: string | null
          descripcion?: string | null
          cantidad_etiquetas?: number | null
          pu_etiqueta?: number | null
        }
      }
      colores: {
        Row: {
          color_id: number
          color: string
        }
        Insert: {
          color_id?: number
          color: string
        }
        Update: {
          color_id?: number
          color?: string
        }
      }
      vendedores: {
        Row: {
          vendedor_id: number
          nombre: string
          apellidos: string
          correo: string
          telefono: string
        }
        Insert: {
          vendedor_id?: number
          nombre: string
          apellidos: string
          correo: string
          telefono: string
        }
        Update: {
          vendedor_id?: number
          nombre?: string
          apellidos?: string
          correo?: string
          telefono?: string
        }
      }
    }
  }
}