"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, User, Package, Receipt, Save, DollarSign, FileText, Loader2 } from "lucide-react";
import { ClienteForm } from "@/components/cotizacion/cliente-form";
import ProductoFormTabs from "@/components/cotizacion/producto-form-tabs";
import { ListaProductos } from "@/components/cotizacion/lista-productos";
import { ListaProductosConDescuento, ProductoConDescuento } from "@/components/cotizacion/lista-productos-con-descuento";
import { ResumenCotizacion } from "@/components/cotizacion/resumen-cotizacion";
import { useProductos, ProductosProvider } from "@/contexts/productos-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cliente } from "@/lib/supabase";
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { Producto as ProductoBase } from '@/components/cotizacion/producto-simplificado';
import { PDFService } from "@/services/pdf-service";

interface ExtendedProductoBase extends ProductoBase {
  cantidad: number;
  sku?: string;
  descripcion?: string;
  colores?: string[];
  acabado?: string;
  descuento: number;
}

// Define the Producto interface properly
interface Producto extends ExtendedProductoBase {
  subtotal: number;
  producto_id?: number | null;
}

// Define the form data interface to fix the 'formData' errors
interface ProductoFormData {
  tipo: 'nuevo' | 'existente';
  producto?: any;
  cantidad?: number;
  [key: string]: any; // Allow additional properties
}

// Define a more explicit type for the API's product format
interface ApiProducto {
  producto_id?: string | number;
  nombre: string;
  cantidad: number | string;
  precio: number;
  descuento?: number;
  sku?: string;
  descripcion?: string;
  colores?: string[] | string;
  acabado?: string;
}

// Extend ProductoBase with additional properties
interface ExtendedProducto extends ProductoBase {
  descuento: number;
  sku: string;
  descripcion: string;
  colores: string[];
  acabado: string;
}

// Create a client component that uses the context
function NuevaCotizacionClient() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<number>(1);
  
  // State for cliente
  const [clienteData, setClienteData] = useState<Cliente | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { convertMXNtoUSD, convertUSDtoMXN } = useExchangeRate();
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [hasIva, setHasIva] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [moneda, setMoneda] = useState<'MXN' | 'USD'>('MXN');
  const [tiempoEstimado, setTiempoEstimado] = useState<number>(6);
  const [tiempoEstimadoMax, setTiempoEstimadoMax] = useState<number>(8);

  // Get productos from context
  const {
    productos,
    addProducto,
    removeProducto,
    updateProductoDiscount: handleUpdateProductDiscount,
    clearProductos, 
    total,
    subtotal,
    exchangeRate,
    setGlobalDiscount: setContextGlobalDiscount,
    setHasIva: setContextHasIva,
    setShippingCost: setContextShippingCost,
    setMoneda: setContextMoneda
  } = useProductos();

  // Add formData state
  const [formData, setFormData] = useState<ProductoFormData>({ tipo: 'nuevo' });

  // Synchronize local state with context state
  useEffect(() => {
    setContextGlobalDiscount(globalDiscount);
  }, [globalDiscount, setContextGlobalDiscount]);

  useEffect(() => {
    setContextHasIva(hasIva);
  }, [hasIva, setContextHasIva]);

  useEffect(() => {
    setContextShippingCost(shippingCost);
  }, [shippingCost, setContextShippingCost]);

  useEffect(() => {
    setContextMoneda(moneda);
  }, [moneda, setContextMoneda]);

  // Debug logging for financial values
  useEffect(() => {
    console.log('Financial values updated:');
    console.log(`Global Discount: ${globalDiscount}%`);
    console.log(`Has IVA: ${hasIva}`);
    console.log(`Shipping Cost: ${shippingCost} ${moneda}`);
    console.log(`Subtotal: ${subtotal}`);
    console.log(`Total: ${total}`);
    console.log(`Exchange Rate: ${exchangeRate}`);
  }, [globalDiscount, hasIva, shippingCost, subtotal, total, moneda, exchangeRate]);

  // Use effect to update cliente state after render
  useEffect(() => {
    // If clienteData is null, reset the cliente state to ensure consistency
    if (clienteData === null) {
      setCliente(null);
      // Also clear from sessionStorage to avoid persistence of old client data
      sessionStorage.removeItem('cotizacion_cliente');
    } else if (clienteData) {
      setCliente(clienteData);
      // Store the updated client data in session storage
      sessionStorage.setItem('cotizacion_cliente', JSON.stringify(clienteData));
    }
  }, [clienteData]);
  
  // Add a useEffect to preserve client data when navigating between steps
  useEffect(() => {
    // Save client data to sessionStorage whenever it changes
    if (cliente) {
      sessionStorage.setItem('cotizacion_cliente', JSON.stringify(cliente));
    }
  }, [cliente]);

  // Add a useEffect to load any previously saved client data on component mount
  useEffect(() => {
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development') {
      // Clear all session storage in development mode
      console.log("Development mode detected: clearing all session storage");
      sessionStorage.removeItem('cotizacion_cliente');
      sessionStorage.removeItem('cotizacion_productoForm');
      sessionStorage.removeItem('navigationOccurred');
      
      // Reset client state
      setClienteData(null);
      setCliente(null);
      
      // Clear products context
      clearProductos();
      
      return; // Skip loading from session storage
    }
    
    // In production, try to load any saved client data from sessionStorage
    const savedCliente = sessionStorage.getItem('cotizacion_cliente');
    if (savedCliente && !cliente) {
      try {
        const parsedCliente = JSON.parse(savedCliente);
        setClienteData(parsedCliente);
        setCliente(parsedCliente);
      } catch (e) {
        console.error("Error parsing saved client data:", e);
      }
    }
  }, []);
  
  // Navigate to next step
  const nextStep = () => {
    if (activeStep === 1 && !cliente) {
      toast.error("Por favor, ingresa la información del cliente");
      return;
    }
    
    if (activeStep === 2 && productos.length === 0) {
      toast.error("Por favor, agrega al menos un producto");
      return;
    }
    
    setActiveStep(prev => Math.min(prev + 1, 3));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Navigate to previous step
  const prevStep = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle generating the quotation
  const handleGenerateCotizacion = async () => {
    if (!cliente) {
      toast.error("Por favor, ingresa la información del cliente");
      return;
    }
    
    if (productos.length === 0) {
      toast.error("Por favor, agrega al menos un producto");
      return;
    }
    
    setIsLoading(true);

    try {
      // Calculate IVA amount
      const subtotalAfterDiscount = subtotal * (1 - globalDiscount / 100);
      const montoIva = hasIva ? subtotalAfterDiscount * 0.16 : 0;
      
      // Handle shipping cost based on currency
      // If in USD, the shippingCost is already in USD, but our context works in MXN
      // We need to pass shipping cost in the way the API expects it
      // The API will further handle the conversion as needed
      
      console.log("Preparing quotation data:");
      console.log(`Currency: ${moneda}`);
      console.log(`Shipping cost: ${shippingCost} ${moneda}`);
      console.log(`Exchange rate: ${exchangeRate}`);
      console.log(`Total: ${total}`);
      console.log(`Tiempo estimado: ${tiempoEstimado} a ${tiempoEstimadoMax} semanas`);
      
      // Prepare data for API call, including all client data
      // This passes the client information to the API, which can create the client if needed
      const quotationData = {
        cliente: cliente,
        create_client_if_needed: !cliente.cliente_id || cliente.cliente_id === 0,
        productos: productos.map(p => ({
          ...p,
          // Use the database producto_id if available
          producto_id: p.producto_id || p.id
        })),
        moneda: moneda,
        subtotal: subtotal,
        descuento_global: globalDiscount,
        iva: hasIva,
        monto_iva: montoIva,
        incluye_envio: shippingCost > 0,
        costo_envio: shippingCost,
        total: total,
        tipo_cambio: exchangeRate,
        tiempo_estimado: tiempoEstimado,
        tiempo_estimado_max: tiempoEstimadoMax
      };
      
      // Call API to save quotation (and client if needed)
      const response = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar la cotización');
      }
      
      // If a new client was created, update our state
      if (result.cliente_creado) {
        console.log("Client was created during quotation:", result.cliente_creado);
        setClienteData(result.cliente_creado);
        setCliente(result.cliente_creado);
        sessionStorage.setItem('cotizacion_cliente', JSON.stringify(result.cliente_creado));
      }
      
      // Create cotizacion object for PDF generation
      const cotizacionForPDF = {
        id: result.cotizacion_id,
        folio: result.folio,
        moneda: moneda,
        subtotal: moneda === 'USD' && exchangeRate ? subtotal / exchangeRate : subtotal,
        descuento_global: globalDiscount,
        iva: hasIva,
        monto_iva: moneda === 'USD' && exchangeRate ? montoIva / exchangeRate : montoIva,
        incluye_envio: shippingCost > 0,
        costo_envio: shippingCost,
        total: moneda === 'USD' && exchangeRate ? total / exchangeRate : total,
        tipo_cambio: exchangeRate,
        tiempo_estimado: tiempoEstimado,
        tiempo_estimado_max: tiempoEstimadoMax,
        productos: moneda === 'USD' && exchangeRate 
          ? productos.map(p => ({
              ...p,
              precio: p.precio / exchangeRate,
              subtotal: p.subtotal / exchangeRate
            }))
          : productos
      };
      
      console.log("Generating PDF with tiempo_estimado:", tiempoEstimado, "to", tiempoEstimadoMax);
      console.log("PDF data:", cotizacionForPDF);
      
      // Generate PDF directly
      try {
        await PDFService.generateReactPDF(
          cliente,
          result.folio,
          cotizacionForPDF,
          { download: true, filename: `${result.folio}-${cliente.nombre.replace(/\s+/g, '-')}.pdf` }
        );
        
        toast.success(`Cotización ${result.folio} generada exitosamente`);
      } catch (pdfError) {
        console.error("Error generating PDF:", pdfError);
        toast.error("La cotización fue guardada pero hubo un error al generar el PDF");
      }
      
      // Clear context data after successful save
      clearProductos();
      setGlobalDiscount(0);
      setHasIva(false);
      setShippingCost(0);
      setTiempoEstimado(6);
      setTiempoEstimadoMax(8);
      
      // Navigate to the cotizaciones page
      router.push('/dashboard/cotizaciones');
      
    } catch (error) {
      console.error('Error generating quotation:', error);
      setIsLoading(false);
      toast.error(error instanceof Error ? error.message : "Error al generar la cotización");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get CSS classes for step indicator
  const getStepClasses = (step: number) => {
    if (step < activeStep) {
      return "text-white bg-teal-500 ring-teal-500"; // completed
    } else if (step === activeStep) {
      return "text-teal-600 bg-white ring-teal-500"; // current
    } else {
      return "text-gray-400 bg-white ring-gray-200"; // upcoming
    }
  };
  
  // Format currency with proper conversion
  const formatCurrency = (amount: number): string => {
    let displayAmount = amount;
    
    // Convert to USD if needed
    if (moneda === 'USD' && exchangeRate) {
      displayAmount = amount / exchangeRate;
      console.log(`formatCurrency - Converting ${amount} MXN → ${displayAmount.toFixed(2)} USD (rate: ${exchangeRate})`);
    }
    
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(displayAmount);
  };

  // Handle currency change
  const handleCurrencyChange = (newCurrency: 'MXN' | 'USD') => {
    console.log(`Changing currency from ${moneda} to ${newCurrency}`);
    setMoneda(newCurrency);
  };

  // Handle adding a product to the cart
  const handleAddProduct = (producto: Producto) => {
    const existingProduct = productos.find(p => p.id === producto.id);
    
    if (existingProduct) {
      // If product exists, update its quantity
      const updatedProduct = {
        ...existingProduct,
        cantidad: existingProduct.cantidad + producto.cantidad,
      };
      
      // Recalculate subtotal
      updatedProduct.subtotal = updatedProduct.precio * updatedProduct.cantidad;
      
      // Clear and update the products list
      clearProductos();
      productos.forEach(p => {
        if (p.id === producto.id) {
          addProducto(updatedProduct);
        } else {
          addProducto(p);
        }
      });
      
      toast.success(`Se actualizó la cantidad del producto a ${updatedProduct.cantidad}`);
    } else {
      // If product doesn't exist, add it as new
      addProducto({
        ...producto,
        subtotal: producto.precio * producto.cantidad
      });
      toast.success('Producto agregado al carrito');
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center mb-12">
          <h1 className="text-2xl font-medium text-gray-900 mb-10">Nueva Cotización</h1>
          
          {/* Step indicators */}
          <div className="flex w-full max-w-md justify-between relative">
            {/* Progress bar */}
            <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200">
              <div 
                className="absolute h-0.5 bg-teal-500 transition-all duration-500" 
                style={{ width: `${(activeStep - 1) * 50}%` }}
              ></div>
            </div>
            
            {/* Step 1 */}
            <div className="flex flex-col items-center relative z-10">
              <button 
                onClick={() => setActiveStep(1)}
                className={`
                  h-9 w-9 rounded-full ring-2 flex items-center justify-center
                  transition-all duration-200 font-medium text-sm
                  ${getStepClasses(1)}
                `}
              >
                1
              </button>
              <span className="mt-2 text-sm font-medium text-gray-700">Cliente</span>
            </div>
            
            {/* Step 2 */}
            <div className="flex flex-col items-center relative z-10">
              <button 
                onClick={() => cliente && setActiveStep(2)}
                className={`
                  h-9 w-9 rounded-full ring-2 flex items-center justify-center
                  transition-all duration-200 font-medium text-sm
                  ${getStepClasses(2)}
                `}
              >
                2
              </button>
              <span className="mt-2 text-sm font-medium text-gray-700">Productos</span>
            </div>
            
            {/* Step 3 */}
            <div className="flex flex-col items-center relative z-10">
              <button 
                onClick={() => cliente && productos.length > 0 && setActiveStep(3)}
                className={`
                  h-9 w-9 rounded-full ring-2 flex items-center justify-center
                  transition-all duration-200 font-medium text-sm
                  ${getStepClasses(3)}
                `}
              >
                3
              </button>
              <span className="mt-2 text-sm font-medium text-gray-700">Finalizar</span>
            </div>
          </div>
        </div>
        
        {/* Step content */}
        <div className="space-y-6">
          {/* Step 1: Cliente */}
          {activeStep === 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-teal-600 mr-2" />
                  <h2 className="text-lg font-medium text-gray-900">Información del Cliente</h2>
                </div>
              </div>
              <div className="p-6">
                <ClienteForm onClienteChange={setClienteData} />
              </div>
              <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/')}
                  className="text-gray-600 border-gray-300 px-4 h-10 text-sm font-medium"
                  size="md"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={nextStep} 
                  disabled={!cliente} 
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 h-10 text-sm font-medium"
                  size="md"
                >
                  <span className="whitespace-nowrap">Continuar</span> <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 2: Productos */}
          {activeStep === 2 && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 text-emerald-600 mr-2" />
                      <h2 className="text-lg font-medium text-gray-900">Agregar Productos</h2>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <ProductoFormTabs onProductoChange={(producto: any) => {
                    if (producto) {
                      // Format product data for addProducto
                      const productoToAdd = {
                        // Use 'new' for new products, real ID for existing ones
                        id: producto.producto_id ? String(producto.producto_id) : 'new',
                        nombre: producto.nombre || '',
                        cantidad: Number(producto.cantidad) || 1,
                        precio: producto.precio || 0,
                        descuento: producto.descuento || 0,
                        subtotal: (producto.precio || 0) * (Number(producto.cantidad) || 1),
                        sku: producto.sku || '',
                        descripcion: producto.descripcion || '',
                        colores: Array.isArray(producto.colores) 
                          ? producto.colores 
                          : typeof producto.colores === 'string' 
                            ? producto.colores.split(',') 
                            : [],
                        acabado: producto.acabado || '',
                        // Add the original producto_id for database reference
                        producto_id: producto.producto_id || null
                      };
                      
                      // Check if this product already exists in the cart by ID
                      const existingProductIndex = productos.findIndex(
                        // For new products, check both id='new' and if the name matches
                        p => (p.id === productoToAdd.id) || 
                             (productoToAdd.id === 'new' && p.id === 'new' && p.nombre === productoToAdd.nombre)
                      );
                      
                      if (existingProductIndex >= 0) {
                        // If it exists, update the quantity and subtotal
                        const updatedProductos = [...productos];
                        const existingProduct = updatedProductos[existingProductIndex];
                        
                        // When the same product is added again, accumulate the quantity
                        const newQuantity = existingProduct.cantidad + productoToAdd.cantidad;
                        
                        updatedProductos[existingProductIndex] = {
                          ...existingProduct,
                          cantidad: newQuantity,
                          subtotal: productoToAdd.precio * newQuantity,
                        };
                        
                        // Replace the entire array in context
                        clearProductos();
                        updatedProductos.forEach(p => addProducto(p));
                        
                        // Show a single notification about the update
                        toast.success(`Se actualizó el producto "${productoToAdd.nombre}" (${newQuantity} unidades)`);
                      } else {
                        // If it's a new product, add it
                        addProducto(productoToAdd);
                        toast.success(`Se agregó "${productoToAdd.nombre}" a la cotización`);
                      }
                    }
                  }} />
                </div>
              </div>
              
              {/* Client summary for this step */}
              {cliente && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-700">Cliente Seleccionado</h3>
                    <Button 
                      variant="ghost" 
                      className="text-teal-600 h-8 px-2 py-0" 
                      onClick={() => setActiveStep(1)}
                    >
                      Cambiar
                    </Button>
                  </div>
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">{cliente.nombre}</p>
                      <p className="text-sm text-gray-500">{cliente.celular}</p>
                      {cliente.correo && <p className="text-sm text-gray-500">{cliente.correo}</p>}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Listed products */}
              {productos.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center">
                      <Receipt className="h-5 w-5 text-emerald-600 mr-2" />
                      <h2 className="text-lg font-medium text-gray-900">Productos Seleccionados</h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <ListaProductos 
                      productos={productos}
                      onRemoveProduct={(id) => removeProducto(id)}
                      moneda={moneda}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 sm:gap-4 px-0 py-4">
                <Button 
                  variant="outline" 
                  onClick={prevStep}
                  className="w-full sm:w-auto"
                  size="action"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> 
                  <span>Regresar</span>
                </Button>
                <Button 
                  onClick={nextStep} 
                  disabled={productos.length === 0} 
                  className="w-full sm:w-auto"
                  variant="default"
                  size="action"
                >
                  <span>Continuar</span> 
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 3: Resumen */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-emerald-600 mr-2" />
                      <h2 className="text-lg font-medium text-gray-900">Resumen de Cotización</h2>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Moneda:</span>
                      <Select value={moneda} onValueChange={(value: 'MXN' | 'USD') => setMoneda(value)}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Moneda" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200">
                          <SelectItem value="MXN">MXN</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {/* Add ListaProductosConDescuento to allow individual product discounts */}
                  <div className="mb-6">
                    <h3 className="text-base font-medium text-gray-700 mb-4">Productos con Descuento Individual</h3>
                    <ListaProductosConDescuento 
                      productos={productos}
                      onRemoveProduct={(id) => removeProducto(id)}
                      onUpdateProductDiscount={handleUpdateProductDiscount}
                      moneda={moneda}
                    />
                  </div>
                  
                  <ResumenCotizacion 
                    cliente={cliente}
                    productos={productos}
                    subtotal={subtotal}
                    globalDiscount={globalDiscount}
                    setGlobalDiscount={setGlobalDiscount}
                    hasIva={hasIva}
                    setHasIva={setHasIva}
                    shippingCost={shippingCost}
                    setShippingCost={setShippingCost}
                    total={total}
                    moneda={moneda}
                    tiempoEstimado={tiempoEstimado}
                    setTiempoEstimado={setTiempoEstimado}
                    tiempoEstimadoMax={tiempoEstimadoMax}
                    setTiempoEstimadoMax={setTiempoEstimadoMax}
                  />
                </div>
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 sm:gap-4 px-0 py-4">
                <Button 
                  variant="outline" 
                  onClick={prevStep}
                  className="w-full sm:w-auto"
                  size="action"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> 
                  <span>Regresar</span>
                </Button>
                <Button 
                  onClick={handleGenerateCotizacion}
                  disabled={isLoading || productos.length === 0} 
                  className="w-full sm:w-auto"
                  variant="success"
                  size="action"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Generando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <FileText className="h-4 w-4 mr-2" /> 
                      <span>Generar Cotización y PDF</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Create the wrapper component that includes the Provider
export default function NuevaCotizacionPage() {
  return (
    <ProductosProvider>
      <NuevaCotizacionClient />
    </ProductosProvider>
  );
}
