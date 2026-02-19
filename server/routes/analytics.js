import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const router = express.Router();

const parsePrice = (priceString) => {
  if (!priceString) return 0;
  
  // Handle different price formats: "$231.00", "231.00 USD", "231.00", etc.
  const priceMatch = priceString.toString().match(/(\d+\.?\d*)/);
  return priceMatch ? parseFloat(priceMatch[1]) : 0;
};
// Get analytics overview
router.get('/overview', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Calculate date range based on period
    const dateRange = calculateDateRange(period);
    
    // Get all orders in the period (we'll process in JavaScript)
    const orders = await Order.find({
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    }).populate('items.productId');

    const paidOrders = orders.filter(order => order.paymentStatus === 'paid');
    const unpaidOrders = orders.filter(order => order.paymentStatus !== 'paid');
    
    // Calculate revenue from paid orders
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
    
    // Get unique customers
    const uniqueCustomers = [...new Set(paidOrders.map(order => order.customer.email))].length;
    
    // Get product count
    const productCount = await Product.countDocuments({ inStock: true });
    
    // Calculate top products
    const productSales = {};
    paidOrders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId?._id?.toString() || item.productId?.toString();
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.name,
            totalSold: 0,
            totalRevenue: 0
          };
        }
        productSales[productId].totalSold += item.quantity;
        
        // Use the parsed price
        const price = parsePrice(item.price);
        productSales[productId].totalRevenue += price * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // Calculate sales over time
    const salesByDate = {};
    paidOrders.forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = 0;
      }
      salesByDate[date] += order.total;
    });

    const salesOverTime = Object.entries(salesByDate)
      .map(([date, dailySales]) => ({
        _id: date,
        dailySales,
        orderCount: paidOrders.filter(order => 
          new Date(order.createdAt).toISOString().split('T')[0] === date
        ).length
      }))
      .sort((a, b) => a._id.localeCompare(b._id));

    const overview = {
      totalRevenue,
      totalOrders: paidOrders.length,
      paidOrders: paidOrders.length,
      unpaidOrders: unpaidOrders.length,
      totalCustomers: uniqueCustomers,
      totalProducts: productCount,
      averageOrderValue: paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0,
      conversionRate: 3.2
    };

    res.json({
      success: true,
      data: {
        overview,
        salesOverTime,
        topProducts
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// // Fallback analytics data without complex aggregations
// const getFallbackAnalyticsData = async (period) => {
//   const dateRange = calculateDateRange(period);
  
//   // Get all orders in the period
//   const orders = await Order.find({
//     createdAt: { $gte: dateRange.start, $lte: dateRange.end }
//   });

//   const paidOrders = orders.filter(order => order.paymentStatus === 'paid');
//   const unpaidOrders = orders.filter(order => order.paymentStatus !== 'paid');
  
//   // Calculate revenue from paid orders
//   const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
  
//   // Get unique customers
//   const uniqueCustomers = [...new Set(paidOrders.map(order => order.customer.email))].length;
  
//   // Get product count
//   const productCount = await Product.countDocuments({ inStock: true });
  
//   // Calculate top products
//   const productSales = {};
//   paidOrders.forEach(order => {
//     order.items.forEach(item => {
//       const productId = item.productId?.toString() || item.productId;
//       if (!productSales[productId]) {
//         productSales[productId] = {
//           name: item.name,
//           totalSold: 0,
//           totalRevenue: 0
//         };
//       }
//       productSales[productId].totalSold += item.quantity;
      
//       // Convert price string to number
//       const priceMatch = item.price.match(/(\d+\.?\d*)/);
//       const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
//       productSales[productId].totalRevenue += price * item.quantity;
//     });
//   });

//   const topProducts = Object.values(productSales)
//     .sort((a, b) => b.totalRevenue - a.totalRevenue)
//     .slice(0, 5);

//   // Calculate sales over time
//   const salesByDate = {};
//   paidOrders.forEach(order => {
//     const date = new Date(order.createdAt).toISOString().split('T')[0];
//     if (!salesByDate[date]) {
//       salesByDate[date] = 0;
//     }
//     salesByDate[date] += order.total;
//   });

//   const salesOverTime = Object.entries(salesByDate)
//     .map(([date, dailySales]) => ({
//       _id: date,
//       dailySales,
//       orderCount: paidOrders.filter(order => 
//         new Date(order.createdAt).toISOString().split('T')[0] === date
//       ).length
//     }))
//     .sort((a, b) => a._id.localeCompare(b._id));

//   return {
//     overview: {
//       totalRevenue,
//       totalOrders: paidOrders.length,
//       paidOrders: paidOrders.length,
//       unpaidOrders: unpaidOrders.length,
//       totalCustomers: uniqueCustomers,
//       totalProducts: productCount,
//       averageOrderValue: paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0,
//       conversionRate: 3.2
//     },
//     salesOverTime,
//     topProducts
//   };
// };

// Helper function to calculate date range


const calculateDateRange = (period) => {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(end.getFullYear() - 1);
      break;
    default:
      start.setDate(end.getDate() - 7);
  }

  return { start, end };
};

export default router;