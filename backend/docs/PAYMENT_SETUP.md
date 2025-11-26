# Payment Gateway Setup Guide

This guide explains how to set up Razorpay payment gateway integration.

## Prerequisites

1. Create a Razorpay account at [https://razorpay.com](https://razorpay.com)
2. Complete KYC verification
3. Get your API keys from the dashboard

## Setup Steps

### Step 1: Get Razorpay API Keys

1. Log in to your Razorpay dashboard
2. Go to **Settings** → **API Keys**
3. Copy the following:
   - **Key ID** → `RAZORPAY_KEY_ID`
   - **Key Secret** → `RAZORPAY_KEY_SECRET`

### Step 2: Update Environment Variables

Add the following to your `backend/.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret  # Optional, for webhook verification
```

### Step 3: Configure Webhook (Optional but Recommended)

1. Go to Razorpay Dashboard → **Settings** → **Webhooks**
2. Add webhook URL: `https://your-backend-url.com/api/payments/webhook`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
4. Copy the webhook secret and add it to `.env`

### Step 4: Test Payment Flow

1. Use Razorpay test keys for development
2. Test payment with Razorpay test cards
3. Verify payment webhook is working

## Payment Flow

1. **Create Order** → User completes checkout
2. **Create Payment Order** → Backend creates Razorpay order
3. **Frontend Payment** → User pays via Razorpay checkout
4. **Verify Payment** → Backend verifies payment signature
5. **Update Order** → Order status updated to "paid"

## API Endpoints

- `POST /api/payments/create-order` - Create Razorpay payment order
- `POST /api/payments/verify` - Verify payment after completion
- `POST /api/payments/webhook` - Webhook handler for payment events

## Test Cards (Razorpay)

- **Success**: `4111 1111 1111 1111`
- **Failure**: `4000 0000 0000 0002`
- **CVV**: Any 3 digits
- **Expiry**: Any future date

## Security Notes

- Never expose `RAZORPAY_KEY_SECRET` in frontend code
- Always verify payment signatures
- Use HTTPS in production
- Validate webhook signatures

