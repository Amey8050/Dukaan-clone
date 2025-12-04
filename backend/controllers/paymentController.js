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

      // Log webhook received (without sensitive data)
      console.log('📥 Payment webhook received:', {
        event: req.body?.event,
        entity: req.body?.payload?.payment?.entity?.id,
        hasSignature: !!webhookSignature,
        hasSecret: !!webhookSecret
      });

      // Verify webhook signature if secret is configured
      if (webhookSecret) {
        const text = JSON.stringify(req.body);
        const generatedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(text)
          .digest('hex');

        if (generatedSignature !== webhookSignature) {
          console.error('❌ Invalid webhook signature:', {
            received: webhookSignature?.substring(0, 10) + '...',
            generated: generatedSignature?.substring(0, 10) + '...'
          });
          
          return res.status(400).json({
            success: false,
            error: {
              message: 'Invalid webhook signature',
              help: 'Verify RAZORPAY_WEBHOOK_SECRET matches the secret in Razorpay dashboard'
            }
          });
        }
      } else {
        console.warn('⚠️  Webhook secret not configured. Skipping signature verification.');
        console.warn('⚠️  To enable webhook verification, add RAZORPAY_WEBHOOK_SECRET to .env');
      }

      const event = req.body.event;
      const payment = req.body.payload?.payment?.entity;
      const orderId = req.body.payload?.order?.entity?.id || payment?.order_id;

      // Handle different webhook events
      switch (event) {
        case 'payment.captured':
          if (payment && orderId) {
            // Find order by Razorpay order ID (stored in payment_id field)
            const { data: orders, error: findError } = await supabaseAdmin
              .from('orders')
              .select('*')
              .eq('payment_id', orderId)
              .limit(1);

            if (findError) {
              console.error('Error finding order:', findError);
              break;
            }

            if (orders && orders.length > 0) {
              const order = orders[0];
              
              // Update order payment status
              const { error: updateError } = await supabaseAdmin
                .from('orders')
                .update({
                  payment_status: 'paid',
                  status: order.status === 'pending' ? 'processing' : order.status,
                  updated_at: new Date().toISOString()
                })
                .eq('id', order.id);

              if (updateError) {
                console.error('Error updating order status:', updateError);
              } else {
                console.log('✅ Order payment status updated:', order.id);

                // Create notification for store owner about payment
                try {
                  const { createOrderNotification } = require('../utils/notificationHelper');
                  const { data: store } = await supabaseAdmin
                    .from('stores')
                    .select('owner_id')
                    .eq('id', order.store_id)
                    .single();

                  if (store) {
                    await createOrderNotification(
                      store.owner_id,
                      order.store_id,
                      order.id,
                      order.total
                    );
                  }
                } catch (notifError) {
                  console.error('Error creating payment notification:', notifError);
                }
              }
            } else {
              console.warn('⚠️  Order not found for payment:', orderId);
            }
          }
          break;

        case 'payment.failed':
          if (payment && orderId) {
            const { data: orders } = await supabaseAdmin
              .from('orders')
              .select('*')
              .eq('payment_id', orderId)
              .limit(1);

            if (orders && orders.length > 0) {
              await supabaseAdmin
                .from('orders')
                .update({
                  payment_status: 'failed',
                  updated_at: new Date().toISOString()
                })
                .eq('id', orders[0].id);
              
              console.log('❌ Payment failed for order:', orders[0].id);
            }
          }
          break;

        case 'order.paid':
          // Handle order paid event
          console.log('✅ Order paid event received:', orderId);
          break;

        default:
          console.log('ℹ️  Unhandled webhook event:', event);
      }

      // Always return success to Razorpay (to avoid retries)
      res.json({ 
        success: true, 
        message: 'Webhook processed successfully',
        event: event,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('💥 Webhook processing error:', error);
      // Still return 200 to prevent Razorpay from retrying
      res.status(200).json({ 
        success: false, 
        message: 'Webhook received but processing failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};

module.exports = paymentController;

