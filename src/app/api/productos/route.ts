import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const onlyIds = searchParams.get('onlyIds') === 'true';
    
    if (onlyIds) {
      // For efficiency, only fetch product IDs
      const { data, error } = await supabase
        .from('productos')
        .select('producto_id')
        .order('producto_id', { ascending: true });
      
      if (error) {
        console.error('Error fetching product IDs:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ productos: data || [] });
    }
    
    // Handle full product listing and search
    const query = searchParams.get('query') || '';
    
    // Get products with search if query provided
    let productosQuery = supabase
      .from('productos')
      .select('*');
    
    if (query) {
      productosQuery = productosQuery.or(`nombre.ilike.%${query}%,sku.ilike.%${query}%`);
    }
    
    const { data, error } = await productosQuery.order('nombre');
    
    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ productos: data || [] });
    
  } catch (error) {
    console.error('Error in productos API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    
    // First, get the next ID for the product
    const { data: maxIdData, error: maxIdError } = await supabase
      .from('productos')
      .select('producto_id')
      .order('producto_id', { ascending: false })
      .limit(1)
      .single();
    
    if (maxIdError && maxIdError.code !== 'PGRST116') { // PGRST116 is returned when no rows found
      throw maxIdError;
    }
    
    // Calculate next ID (if no products exist, start with 1)
    const nextId = maxIdData ? maxIdData.producto_id + 1 : 1;
    
    // Now insert with the explicitly specified ID
    const { data, error } = await supabase
      .from('productos')
      .insert({
        producto_id: nextId,
        nombre: body.nombre.trim(),
        tipo_ceramica: body.tipo_ceramica || null,
        precio: body.precio || 0,
        sku: body.sku || null,
        capacidad: body.capacidad || null,
        unidad: body.unidad || null,
        tipo_producto: body.tipo_producto || null,
        descripcion: body.descripcion || null,
        colores: body.colores || null,
        tiempo_produccion: body.tiempo_produccion || null,
        cantidad_inventario: body.cantidad_inventario || 0,
        inventario: body.inventario || null
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      producto: data
    });
  } catch (error) {
    console.error('Error creating producto:', error);
    // If it's a Supabase error, include more details
    if (error && typeof error === 'object' && 'code' in error) {
      return NextResponse.json(
        { error: `Database error: ${error.code} - ${error.message || 'Failed to create producto'}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create producto' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();
  
  if (!body.producto_id) {
    return NextResponse.json(
      { error: 'Producto ID is required' },
      { status: 400 }
    );
  }
  
  try {
    const { data, error } = await supabase
      .from('productos')
      .update({
        nombre: body.nombre,
        tipo_ceramica: body.tipo_ceramica,
        precio: body.precio,
        sku: body.sku,
        capacidad: body.capacidad,
        unidad: body.unidad,
        tipo_producto: body.tipo_producto,
        descripcion: body.descripcion,
        colores: body.colores,
        tiempo_produccion: body.tiempo_produccion,
        cantidad_inventario: body.cantidad_inventario,
        inventario: body.inventario
      })
      .eq('producto_id', body.producto_id)
      .select()
      .single();
      
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      producto: data
    });
  } catch (error) {
    console.error('Error updating producto:', error);
    return NextResponse.json(
      { error: 'Failed to update producto' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
  } catch (error) {
    console.error('Error deleting producto:', error);
    return NextResponse.json(
      { error: 'Failed to delete producto' },
      { status: 500 }
    );
  }
}