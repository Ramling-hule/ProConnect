import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';
import toast from 'react-hot-toast';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

export default function PaymentFlow({ type, entityId, amount, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle');
  const { user } = useSelector(state => state.auth);
  const router = useRouter();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    setStatus('processing');
    try {
      const { data: orderData } = await apiClient.post('/api/payment/generic/create-order', {
        type,
        entityId
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dummy_key_id',
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'ProConnect',
        description: `Payment for ${type}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            const verifyRes = await apiClient.post('/api/payment/generic/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setStatus('success');
            toast.success('Payment successful!');
            if (onSuccess) onSuccess(verifyRes.data);
          } catch (err) {
            console.error(err);
            setError('Payment verification failed.');
            setStatus('idle');
            toast.error('Payment verification failed.');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: '#3B82F6',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error(response.error);
        setError(response.error.description || 'Payment failed.');
        setStatus('idle');
        toast.error('Payment failed. Please try again.');
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to initialize payment.');
      setStatus('idle');
      toast.error('Failed to initialize payment.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-2xl bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">Payment Successful!</h3>
        <p className="text-slate-600 dark:text-slate-300">Your registration is now confirmed.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-brand-primary/10 p-3 rounded-full">
          <CreditCard className="w-6 h-6 text-brand-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Complete Payment</h3>
          <p className="text-sm text-slate-500">Secure payment via Razorpay</p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6 flex justify-between items-center">
        <span className="font-medium text-slate-600 dark:text-slate-300">Amount to Pay</span>
        <span className="text-xl font-bold">₹{amount}</span>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 flex items-start space-x-2 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex space-x-3">
        {onCancel && (
          <button 
            onClick={onCancel}
            disabled={loading || status === 'processing'}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button 
          onClick={handlePayment}
          disabled={loading || status === 'processing'}
          className="flex-1 px-4 py-3 rounded-xl bg-brand-primary text-white font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-50 flex justify-center items-center"
        >
          {loading || status === 'processing' ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            `Pay ₹${amount}`
          )}
        </button>
      </div>
    </div>
  );
}
