// Payment Controller
const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../config/config');
const { supabaseAdmin } = require('../utils/supabaseClient');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

const paymentController = {
  // Create payment order (for Razorpay)
  createPaymentOrder: async (req, res, next) => {
    try {
      const { order_id, amount } = req.body;

      if (!order_id || !amount) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Order ID and amount are required'
          }
        });
      }

      // Verify order exists
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single();

      if (orderError || !order) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Order not found'
          }
        });
      }

      // Create Razorpay order
      const options = {
        amount: Math.round(parseFloat(amount) * 100), // Convert to paise (Razorpay uses smallest currency unit)
        currency: order.currency || 'INR',
        receipt: order.order_number,
        notes: {
          order_id: order.id,
          order_number: order.order_number,
        },
      };

      const razorpayOrder = await razorpay.orders.create(options);

      // Update order with payment ID
      await supabaseAdmin
        .from('orders')
        .update({
          payment_id: razorpayOrder.id,
        })
        .eq('id', order_id);

      res.json({
        success: true,
        data: {
          order_id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key_id: process.env.RAZORPAY_KEY_ID,
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Verify payment (webhook/callback)
  verifyPayment: async (req, res, next) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Payment verification data is required'
          }
        });
      }

      // Verify signature
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(text)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid payment signature'
          }
        });
      }

      // Find order by payment_id
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('payment_id', razorpay_order_id)
        .single();

      if (orderError || !order) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Order not found'
          }
        });
      }

      // Update order payment status
      const { data: updatedOrder, error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing', // Move to processing after payment
        })
        .eq('id', order.id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to update order status'
          }
        });
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          order: updatedOrder,
          payment_id: razorpay_payment_id
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Payment webhook handler
  handleWebhook: async (req, res, next) => {
    try {
      const webhookSignature = req.headers['x-razorpay-signature'];
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

      // Verify webhook signature
      const text = JSON.stringify(req.body);
      const generatedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(text)
        .digest('hex');

      if (generatedSignature !== webhookSignature) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid webhook signature'
          }
        });
      }

      const event = req.body.event;
      const payment = req.body.payload.payment?.entity;

      if (event === 'payment.captured' && payment) {
        // Find order by payment_id
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('payment_id', payment.order_id)
          .single();

        if (order) {
          // Update order payment status
          await supabaseAdmin
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'processing',
            })
            .eq('id', order.id);
        }
      }

      res.json({ success: true, message: 'Webhook processed' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = paymentController;

