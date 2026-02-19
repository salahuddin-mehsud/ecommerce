import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet,
  Font
} from '@react-pdf/renderer';
import PropTypes from 'prop-types';
import { useCallback } from 'react';

// Register fonts for better performance (optional but recommended)
try {
  Font.register({
    family: 'Helvetica',
    fonts: [
      { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
      { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
      { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
      { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
    ],
  });
} catch (error) {
  console.log('Font registration failed, using fallback fonts');
}

// Create optimized styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 25, // Reduced padding for better space utilization
    fontFamily: 'Helvetica',
    fontSize: 10, // Base font size
  },
  header: {
    marginBottom: 15,
    borderBottom: '2px solid #d97706',
    paddingBottom: 8,
  },
  companyName: {
    fontSize: 20, // Slightly smaller
    fontWeight: 700,
    color: '#d97706',
    marginBottom: 4,
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 8,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
    backgroundColor: '#f3f4f6',
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  column: {
    flexDirection: 'column',
    flex: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: 500,
    color: '#374151',
  },
  value: {
    fontSize: 9,
    color: '#6b7280',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginVertical: 8,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f8fafc',
    padding: 4,
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 4,
  },
  tableCellHeader: {
    fontSize: 9,
    fontWeight: 700,
    textAlign: 'center',
  },
  tableCell: {
    fontSize: 8,
    textAlign: 'center',
  },
  summary: {
    marginTop: 15,
    padding: 8,
    backgroundColor: '#fffbeb',
    border: '1px solid #f59e0b',
  },
  total: {
    fontSize: 12,
    fontWeight: 700,
    color: '#d97706',
    textAlign: 'right',
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 25,
    right: 25,
    textAlign: 'center',
    fontSize: 7,
    color: '#9ca3af',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 8,
  },
  // Payment status styles
  statusPaid: {
    color: '#059669',
    fontWeight: 700,
  },
  statusUnpaid: {
    color: '#dc2626',
    fontWeight: 700,
  },
  statusPending: {
    color: '#d97706',
    fontWeight: 700,
  },
  statusFailed: {
    color: '#dc2626',
    fontWeight: 700,
  },
  // Compact styles for better space usage
  compactText: {
    fontSize: 8,
  },
  noteText: {
    fontSize: 7,
    color: '#d97706',
    marginTop: 4,
  }
});

const PDFInvoice = ({ order }) => {
  // Memoized date formatting
  const formatDate = useCallback((dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }, []);

  // Memoized item total calculation
  const calculateItemTotal = useCallback((item) => {
    try {
      const unitPrice = parseFloat(item.price.replace('$', '').replace(' USD', ''));
      return unitPrice * item.quantity;
    } catch {
      return 0;
    }
  }, []);

  // Memoized payment status info
  const getPaymentStatusInfo = useCallback(() => {
    const paymentMethod = order.paymentMethod || 'card';
    const paymentStatus = order.paymentStatus || 'paid';
    
    // Cash on Delivery logic
    if (paymentMethod === 'cash_on_delivery') {
      return {
        status: 'PENDING',
        style: styles.statusPending,
        method: 'Cash on Delivery'
      };
    }
    
    // Card payment logic
    switch (paymentStatus.toLowerCase()) {
      case 'paid':
        return {
          status: 'PAID',
          style: styles.statusPaid,
          method: 'Credit Card/Debit Card'
        };
      case 'failed':
        return {
          status: 'FAILED',
          style: styles.statusFailed,
          method: 'Credit Card/Debit Card'
        };
      case 'processing':
        return {
          status: 'PROCESSING',
          style: styles.statusPending,
          method: 'Credit Card/Debit Card'
        };
      default:
        return {
          status: 'PAID',
          style: styles.statusPaid,
          method: 'Credit Card/Debit Card'
        };
    }
  }, [order.paymentMethod, order.paymentStatus]);

  const paymentInfo = getPaymentStatusInfo();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>Daily</Text>
          <Text style={styles.invoiceTitle}>ORDER CONFIRMATION & INVOICE</Text>
        </View>

        {/* Invoice Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INVOICE DETAILS</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Order ID:</Text>
              <Text style={styles.value}>{order.orderId}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Invoice Date:</Text>
              <Text style={styles.value}>{formatDate(order.createdAt)}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Payment Reference:</Text>
              <Text style={styles.value}>{order.paymentReference || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BILL TO</Text>
          <Text style={styles.value}>
            {order.customer.firstName} {order.customer.lastName}
          </Text>
          <Text style={styles.value}>{order.customer.email}</Text>
          <Text style={styles.value}>{order.customer.address}</Text>
          <Text style={styles.value}>
            {order.customer.city}, {order.customer.zipCode}
          </Text>
          <Text style={styles.value}>{order.customer.country}</Text>
        </View>

        {/* Order Items - Optimized table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ORDER ITEMS</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Item Description</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Qty</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Unit Price</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Total</Text>
              </View>
            </View>
            
            {/* Table Rows */}
            {order.items.map((item, index) => (
              <View style={styles.tableRow} key={index}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{item.name}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{item.quantity}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{item.price}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    ${calculateItemTotal(item).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summary}>
          <Text style={styles.sectionTitle}>ORDER SUMMARY</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Subtotal:</Text>
            <Text style={styles.value}>${order.subtotal.toFixed(2)}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>
              Tax ({order.taxPercentage}%):
            </Text>
            <Text style={styles.value}>${order.taxAmount.toFixed(2)}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Shipping:</Text>
            <Text style={styles.value}>${order.shippingCost.toFixed(2)}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.total}>TOTAL: ${order.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT INFORMATION</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Status:</Text>
            <Text style={[styles.value, paymentInfo.style]}>
              {paymentInfo.status}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method:</Text>
            <Text style={styles.value}>{paymentInfo.method}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Date:</Text>
            <Text style={styles.value}>{formatDate(order.createdAt)}</Text>
          </View>
          
          {/* Additional notes */}
          {order.paymentMethod === 'cash_on_delivery' && (
            <Text style={styles.noteText}>
              * Payment will be collected upon delivery
            </Text>
          )}
          
          {order.paymentMethod === 'card' && paymentInfo.status === 'PAID' && (
            <Text style={styles.noteText}>
              * Payment successfully processed via card
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your purchase!</Text>
          <Text>Daily Customer Service • Email: support@daily.com</Text>
          <Text>Automated invoice generated on {formatDate(new Date().toISOString())}</Text>
        </View>
      </Page>
    </Document>
  );
};

PDFInvoice.propTypes = {
  order: PropTypes.shape({
    orderId: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    paymentReference: PropTypes.string,
    paymentMethod: PropTypes.string,
    paymentStatus: PropTypes.string,
    customer: PropTypes.shape({
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      address: PropTypes.string.isRequired,
      city: PropTypes.string.isRequired,
      zipCode: PropTypes.string.isRequired,
      country: PropTypes.string.isRequired,
    }).isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        quantity: PropTypes.number.isRequired,
        price: PropTypes.string.isRequired
      })
    ).isRequired,
    subtotal: PropTypes.number.isRequired,
    taxPercentage: PropTypes.number.isRequired,
    taxAmount: PropTypes.number.isRequired,
    shippingCost: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
  }).isRequired,
};

export default PDFInvoice;