import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ZoomIn, ZoomOut, RotateCw, Loader2, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';

// Configure pdfjs worker dynamically
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface PdfCanvasViewerProps {
  pdfDoc: jsPDF;
  title: string;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({ pdfDoc }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderTasksRef = useRef<Map<number, any>>(new Map());

  useEffect(() => {
    let isCancelled = false;

    const renderPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cancel previous render tasks if any
        renderTasksRef.current.forEach((task) => {
          try {
            task.cancel();
          } catch (e) {
            // Ignore cancel error
          }
        });
        renderTasksRef.current.clear();

        const arrayBuffer = pdfDoc.output('arraybuffer');
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        if (isCancelled) return;

        setNumPages(pdf.numPages);

        // Render each page to its canvas
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          if (isCancelled) return;

          const canvas = canvasesRef.current.get(pageNum);
          if (!canvas) continue;

          const dpr = Math.min(window.devicePixelRatio || 1.5, 2.5);
          const baseViewport = page.getViewport({ scale: 1.0, rotation });
          const containerWidth = containerRef.current ? containerRef.current.clientWidth - 48 : 650;
          const fitScale = Math.max(0.6, Math.min(containerWidth / baseViewport.width, 1.35));
          const effectiveScale = fitScale * zoom;

          const viewport = page.getViewport({ scale: effectiveScale, rotation });
          
          // Setup HiDPI Canvas
          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;

          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) continue;

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const renderContext: any = {
            canvasContext: ctx,
            viewport: viewport,
            transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
            canvas: canvas,
          };

          const renderTask = page.render(renderContext);
          renderTasksRef.current.set(pageNum, renderTask);

          await renderTask.promise;
        }

        setLoading(false);
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException' && !isCancelled) {
          console.error('PDF Canvas Render Error:', err);
          setError('Could not render document preview. Please use the Download button to view the file.');
          setLoading(false);
        }
      }
    };

    renderPdf();

    return () => {
      isCancelled = true;
      renderTasksRef.current.forEach((task) => {
        try {
          task.cancel();
        } catch (e) {}
      });
      renderTasksRef.current.clear();
    };
  }, [pdfDoc, zoom, rotation]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2.2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.6));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full w-full bg-[#2a2d32] overflow-hidden select-none">
      {/* Top Floating Control Toolbar */}
      <div className="bg-[#1f2228] px-4 py-2.5 flex items-center justify-between border-b border-white/10 text-white text-xs shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-200">
            {numPages > 0 ? `Page 1 to ${numPages}` : 'Loading document...'}
          </span>
          <span className="text-white/30">•</span>
          <span className="text-slate-400 text-[11px] hidden sm:inline">A4 Statement (Fitback Reset)</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.6}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono text-slate-300 text-[11px] min-w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 2.2}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-white/20 mx-1" />

          <button
            onClick={handleRotate}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1 cursor-pointer"
            title="Rotate Page"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main PDF Canvas Scroll Viewport */}
      <div
        ref={containerRef}
        tabIndex={0}
        className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-auto p-4 sm:p-6 md:p-8 flex flex-col items-center gap-6 relative focus:outline-hidden"
        style={{
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {loading && (
          <div className="absolute inset-0 bg-[#2a2d32]/85 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#84d4d5] mb-2" />
            <p className="text-sm font-medium">Rendering A4 Preview...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 my-auto">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Generate canvas for each page (A4 layout with clean drop shadow) */}
        {Array.from({ length: numPages || 1 }, (_, i) => i + 1).map((pageNum) => (
          <div
            key={pageNum}
            id={`pdf-page-${pageNum}`}
            className="flex flex-col items-center bg-white rounded-md shadow-2xl overflow-hidden border border-black/20 shrink-0 transition-transform duration-200 my-1"
          >
            <canvas
              ref={(el) => {
                if (el) canvasesRef.current.set(pageNum, el);
                else canvasesRef.current.delete(pageNum);
              }}
              className="block"
            />
            {numPages > 1 && (
              <div className="w-full py-1.5 text-center bg-slate-100 text-[10px] text-slate-500 border-t border-slate-200 font-mono">
                Page {pageNum} of {numPages}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
