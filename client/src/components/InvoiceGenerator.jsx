import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PDFDownloadLink, BlobProvider } from '@react-pdf/renderer';
import PDFInvoice from './PDFInvoice';
import { emailAPI, orderAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import PropTypes from 'prop-types';

const InvoiceGenerator = ({ order, onDownloadComplete }) => {
  const [isClient, setIsClient] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  
  // Use refs to track actions
  const emailAttemptedRef = useRef(false);
  const pdfDownloadedRef = useRef(false);
  const autoDownloadRef = useRef(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDownloadComplete = useCallback(() => {
    if (!pdfDownloadedRef.current) {
      pdfDownloadedRef.current = true;
      setPdfDownloaded(true);
      if (onDownloadComplete) {
        onDownloadComplete(order.orderId);
      }
    }
  }, [onDownloadComplete, order.orderId]);

  const handleSendEmail = useCallback(async () => {
    // Prevent multiple attempts
    if (emailSent || sendingEmail || emailAttemptedRef.current) return;
    
    emailAttemptedRef.current = true;
    setSendingEmail(true);
    
    try {
      console.log('🔄 Sending email via frontend EmailJS...');
      
      const result = await emailAPI.sendPaymentConfirmation(order);
      
      if (result.success) {
        setEmailSent(true);
        toast.success('Order confirmation has been sent to your email!');
        console.log('✅ Email sent successfully via frontend');
        
        // Update order status on server
        try {
          await orderAPI.updatePaymentStatus(order._id, {
            'notifications.paymentEmailSent': true,
            'notifications.paymentEmailSentAt': new Date()
          });
        } catch (updateError) {
          console.log('Note: Could not update email status on server', updateError);
        }
      } else {
        toast.error(result.error || 'Failed to send email confirmation. Your order is still confirmed.');
        console.error('❌ Failed to send email:', result.error);
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      toast.error('Error sending email confirmation. Your order is still confirmed.');
    } finally {
      setSendingEmail(false);
    }
  }, [order, emailSent, sendingEmail]);

  // Auto-send email only once when PDF is downloaded
  useEffect(() => {
    if (pdfDownloaded && !emailSent && !sendingEmail && !emailAttemptedRef.current) {
      const timer = setTimeout(() => {
        handleSendEmail();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [pdfDownloaded, emailSent, sendingEmail, handleSendEmail]);

  // Memoized order info for display
  const orderInfo = useMemo(() => ({
    orderId: order.orderId,
    total: order.total.toFixed(2),
    email: order.customer.email
  }), [order.orderId, order.total, order.customer.email]);

  // Status messages
  const statusMessage = useMemo(() => {
    if (emailSent) return 'Order confirmation has been sent to your email!';
    if (sendingEmail) return 'Sending order confirmation to your email...';
    if (pdfDownloaded) return 'Preparing to send email confirmation...';
    return 'Your invoice is being prepared...';
  }, [emailSent, sendingEmail, pdfDownloaded]);

  return (
    <div className="flex flex-col items-center justify-center min-h-64 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="text-center w-full max-w-md">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">
          Payment Successful!
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
          {statusMessage}
        </p>

        {emailSent && (
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
              <span className="text-blue-800 dark:text-blue-200 font-medium text-sm">
                Confirmation sent to {orderInfo.email}
              </span>
            </div>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Order ID:</strong> {orderInfo.orderId}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Amount Paid:</strong> ${orderInfo.total}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Email:</strong> {orderInfo.email}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {isClient && (
            <PDFDownloadLink
              document={<PDFInvoice order={order} />}
              fileName={`Invoice_${order.orderId}.pdf`}
              className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 font-sans font-semibold transition-colors text-center text-sm"
              onClick={handleDownloadComplete}
            >
              {({ loading }) => 
                loading ? '📥 Generating PDF...' : pdfDownloaded ? '📥 Download Again' : '📥 Download PDF'
              }
            </PDFDownloadLink>
          )}
          
          <button
            onClick={() => window.location.href = '/'}
            className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-sans font-semibold transition-colors text-sm"
            aria-label="Continue shopping"
          >
            🏠 Continue Shopping
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          {emailSent 
            ? 'Check your email for the order confirmation with all details.'
            : `Check your downloads folder for Invoice_${order.orderId}.pdf`
          }
        </p>

        {/* Auto-download PDF - Only runs once */}
        {isClient && !autoDownloadRef.current && (
          <div style={{ display: 'none' }}>
            <BlobProvider document={<PDFInvoice order={order} />}>
              {({url, loading}) => {
                if (url && !loading && !autoDownloadRef.current) {
                  autoDownloadRef.current = true;
                  
                  setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Invoice_${order.orderId}.pdf`;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    setPdfDownloaded(true);
                    if (onDownloadComplete) {
                      onDownloadComplete(order.orderId);
                    }
                  }, 500);
                }
                return null;
              }}
            </BlobProvider>
          </div>
        )}
      </div>
    </div>
  );
};

InvoiceGenerator.propTypes = {
  order: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    orderId: PropTypes.string.isRequired,
    total: PropTypes.number.isRequired,
    customer: PropTypes.shape({
      email: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  onDownloadComplete: PropTypes.func,
};

export default React.memo(InvoiceGenerator);