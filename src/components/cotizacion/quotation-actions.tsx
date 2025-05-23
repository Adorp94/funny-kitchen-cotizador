'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, FileText, Download } from 'lucide-react'
import { toast } from "sonner";

// Add function to detect mobile devices
const isMobileDevice = () => {
  return (
    typeof window !== 'undefined' && 
    (window.innerWidth <= 768 || 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
  );
};

interface QuotationActionsProps {
  cotizacionId: number;
  hasExistingPdf: boolean;
  onPdfGenerated?: (pdfUrl: string) => void;
  clientName?: string;
}

export default function QuotationActions({ 
  cotizacionId, 
  hasExistingPdf,
  onPdfGenerated,
  clientName = 'Cliente'
}: QuotationActionsProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGeneratePdf = async () => {
    try {
      setIsGenerating(true)
      
      const response = await fetch(`/api/cotizaciones/${cotizacionId}/pdf`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate PDF')
      }
      
      const data = await response.json()
      
      toast.success("PDF Generado", {
        description: "El PDF ha sido generado y guardado correctamente.",
      })
      
      // Call the callback with the PDF URL if provided
      if (onPdfGenerated && data.pdfUrl) {
        onPdfGenerated(data.pdfUrl)
      }
      
      // View or download the PDF based on device
      if (data.pdfUrl) {
        if (isMobileDevice()) {
          // For mobile devices, trigger download
          const link = document.createElement('a');
          link.href = data.pdfUrl;
          link.setAttribute('download', `${cotizacionId}-${clientName.replace(/\s+/g, '-')}.pdf`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // For desktop, open in a new tab
          window.open(data.pdfUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error(error instanceof Error ? error.message : "Ocurrió un error al generar el PDF")
    } finally {
      setIsGenerating(false)
    }
  }
  
  return (
    <div className="flex gap-2">
      <Button 
        onClick={handleGeneratePdf} 
        disabled={isGenerating}
        variant="outline"
        id="generate-pdf-button"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            {hasExistingPdf ? 'Regenerar PDF' : 'Generar PDF'}
          </>
        )}
      </Button>
    </div>
  )
} 