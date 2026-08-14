import React, { useState } from 'react';
import {
  X,
  Download,
  Share2,
  FileText,
  Copy,
  Check,
  Mail,
  Send,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { PdfCanvasViewer } from './PdfCanvasViewer';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfDoc: jsPDF | null;
  title: string;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  pdfDoc,
  title,
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  if (!isOpen || !pdfDoc) return null;

  const fileName = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

  const handleDownload = () => {
    try {
      pdfDoc.save(fileName);
    } catch (e) {
      console.error('Error saving PDF:', e);
    }
  };

  // 1. Native Web Share with actual PDF File
  const handleNativeShare = async () => {
    try {
      const pdfBlob = pdfDoc.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title,
          text: `Fitback Reset Clinic - ${title}`,
        });
        setShareStatus('Shared successfully!');
        setTimeout(() => setShareStatus(null), 3000);
        return;
      } else if (navigator.share) {
        // Fallback to text share if files aren't supported
        await navigator.share({
          title: title,
          text: `Fitback Reset Clinic Statement: ${title}`,
          url: window.location.href,
        });
        return;
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Native share failed or cancelled:', err);
      }
    }
    // If native share is not supported, toggle the direct share menu
    setShowShareMenu(true);
  };

  // 2. WhatsApp Direct Share
  const handleShareWhatsApp = () => {
    handleDownload(); // Automatically download so they have the file ready to attach
    const message = encodeURIComponent(
      `*Fitback Reset - Physiotherapy Clinic Statement*\n📄 *Document:* ${title}\n📅 *Date:* ${new Date().toLocaleDateString('en-GB')}\n\nI have downloaded the statement PDF to attach here.`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
    setShowShareMenu(false);
    setShareStatus('Opening WhatsApp...');
    setTimeout(() => setShareStatus(null), 3500);
  };

  // 3. Messenger Direct Share
  const handleShareMessenger = () => {
    handleDownload();
    window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(window.location.href)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(window.location.href)}`, '_blank');
    setShowShareMenu(false);
    setShareStatus('Opening Messenger...');
    setTimeout(() => setShareStatus(null), 3500);
  };

  // 4. Email Share
  const handleShareEmail = () => {
    handleDownload();
    const subject = encodeURIComponent(`Fitback Reset Clinic Statement - ${title}`);
    const body = encodeURIComponent(
      `Hello,\n\nPlease find attached the official A4 PDF statement from Fitback Reset Physiotherapy & Spine Rehabilitation Clinic.\n\nDocument: ${title}\nDate: ${new Date().toLocaleDateString('en-GB')}\n\nFitback Reset Clinic • Reshaping Lives...`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    setShowShareMenu(false);
  };

  // 5. Copy Statement Info to Clipboard
  const handleCopyInfo = () => {
    const text = `Fitback Reset - Physiotherapy & Spine Rehabilitation Clinic\nDocument: ${title}\nGenerated on: ${new Date().toLocaleDateString('en-GB')}\nStatus: Official Verified Statement`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn overflow-hidden">
      <div className="bg-white dark:bg-[#283044] rounded-2xl w-full max-w-5xl h-[92vh] max-h-[92vh] shadow-2xl border border-[#bec9c8]/30 flex flex-col min-h-0 overflow-hidden relative">
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3 bg-white dark:bg-[#131b2e] border-b border-[#bec9c8]/20 flex flex-wrap justify-between items-center gap-2 shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-[#eaedff] dark:bg-[#283044] text-[#005052] dark:text-[#84d4d5] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-[#131b2e] dark:text-[#faf8ff] truncate">
                  A4 PDF Document Preview
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#e62663]/10 text-[#e62663] border border-[#e62663]/20">
                  Ready to Print / Share
                </span>
              </div>
              <p className="text-xs text-[#6e7979] truncate max-w-xs sm:max-w-md md:max-w-lg">{title}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Share Button with Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  if (navigator.share) {
                    handleNativeShare();
                  } else {
                    setShowShareMenu(!showShareMenu);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#005052]/30 bg-[#eaedff] dark:bg-[#131b2e] text-xs font-bold text-[#005052] dark:text-[#84d4d5] hover:bg-[#005052]/10 transition-all shadow-2xs active:scale-95"
                title="Share PDF via WhatsApp, Messenger, Email, etc."
              >
                <Share2 className="w-4 h-4 text-[#e62663]" />
                <span>Share</span>
              </button>

              {/* Share Options Popover */}
              {showShareMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowShareMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1c2438] rounded-2xl shadow-xl border border-[#bec9c8]/30 p-2 z-40 space-y-1 animate-fadeIn">
                    <div className="px-3 py-2 border-b border-[#bec9c8]/20">
                      <p className="text-xs font-bold text-[#131b2e] dark:text-[#faf8ff]">
                        Share Statement
                      </p>
                      <p className="text-[11px] text-[#6e7979]">
                        Downloads PDF and opens target app
                      </p>
                    </div>

                    {/* WhatsApp */}
                    <button
                      onClick={handleShareWhatsApp}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#25D366]/10 text-[#131b2e] dark:text-[#faf8ff] text-xs font-medium transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-[#1e7e34] dark:text-[#25D366]">WhatsApp</div>
                        <div className="text-[10px] text-[#6e7979]">Share to chat or contact</div>
                      </div>
                    </button>

                    {/* Messenger */}
                    <button
                      onClick={handleShareMessenger}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#0084FF]/10 text-[#131b2e] dark:text-[#faf8ff] text-xs font-medium transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#0084FF] text-white flex items-center justify-center shrink-0">
                        <Send className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-[#0066cc] dark:text-[#0084FF]">Messenger</div>
                        <div className="text-[10px] text-[#6e7979]">Send via Facebook Messenger</div>
                      </div>
                    </button>

                    {/* Email */}
                    <button
                      onClick={handleShareEmail}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#005052]/10 text-[#131b2e] dark:text-[#faf8ff] text-xs font-medium transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#005052] text-white flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold">Email Statement</div>
                        <div className="text-[10px] text-[#6e7979]">Open default email app</div>
                      </div>
                    </button>

                    {/* Copy Info */}
                    <button
                      onClick={handleCopyInfo}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#eaedff] dark:hover:bg-[#283044] text-[#131b2e] dark:text-[#faf8ff] text-xs font-medium transition-colors text-left border-t border-[#bec9c8]/20"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Copy className="w-4 h-4 text-[#6e7979] shrink-0" />
                      )}
                      <span>{copied ? 'Summary Copied!' : 'Copy Summary Text'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#005052] text-white text-xs font-bold hover:bg-[#006a6c] active:scale-95 transition-all shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#6e7979] hover:bg-[#eaedff] dark:hover:bg-[#384259] transition-colors ml-1"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast feedback */}
        {shareStatus && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#131b2e] text-white text-xs px-4 py-2 rounded-full shadow-lg border border-[#84d4d5]/40 flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{shareStatus}</span>
          </div>
        )}

        {/* Embedded High-Fidelity Canvas Preview */}
        <PdfCanvasViewer pdfDoc={pdfDoc} title={title} />
      </div>
    </div>
  );
};
