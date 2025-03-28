import { NextRequest, NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Cotización ID es requerido' }, 
        { status: 400 }
      );
    }
    
    const supabase = createClientComponentClient();
    
    // Get the cotizacion with its client
    const { data: cotizacion, error: cotizacionError } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        cliente:cliente_id(*)
      `)
      .eq('cotizacion_id', id)
      .single();
      
    if (cotizacionError) {
      console.error('Error fetching quotation:', cotizacionError);
      return NextResponse.json(
        { error: 'Error al obtener la cotización' }, 
        { status: 500 }
      );
    }
    
    if (!cotizacion) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' }, 
        { status: 404 }
      );
    }
    
    // Get the quotation products
    const { data: productos, error: productosError } = await supabase
      .from('cotizacion_productos')
      .select(`
        *,
        producto:producto_id(*)
      `)
      .eq('cotizacion_id', id);
    
    if (productosError) {
      console.error('Error fetching quotation products:', productosError);
      return NextResponse.json(
        { error: 'Error al obtener los productos de la cotización' }, 
        { status: 500 }
      );
    }
    
    // Format the products to match the expected structure
    const formattedProductos = productos.map(item => ({
      id: item.producto.producto_id.toString(),
      nombre: item.producto.nombre,
      cantidad: item.cantidad,
      precio: item.precio_unitario,
      precio_mxn: item.precio_unitario_mxn || item.precio_unitario,
      descuento: item.descuento_producto,
      subtotal: item.subtotal,
      subtotal_mxn: item.subtotal_mxn || item.subtotal,
      sku: item.producto.sku,
      descripcion: item.producto.descripcion,
      colores: item.producto.colores?.split(',') || []
    }));
    
    // Return the formatted response
    return NextResponse.json({
      cotizacion: {
        ...cotizacion,
        productos: formattedProductos
      }
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado al obtener la cotización' },
      { status: 500 }
    );
  }
} 