"use client";
import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';
import { Calendar, Clock, Video } from 'lucide-react';
import PaymentFlow from '@/Components/PaymentFlow';

export default function MySessionsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentBooking, setPaymentBooking] = useState(null);

  const fetchBookings = () => {
    setLoading(true);
    apiClient.get('/api/bookings/user')
      .then(res => setBookings(res.data.bookings || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  if (paymentBooking) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Complete Payment</h1>
        <PaymentFlow 
          type="session"
          entityId={paymentBooking._id}
          amount={paymentBooking.amount}
          onSuccess={() => {
            setPaymentBooking(null);
            fetchBookings();
          }}
          onCancel={() => setPaymentBooking(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Sessions</h1>
      {loading ? (
        <div className="text-center p-6 text-slate-500">Loading your sessions...</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
          <h2 className="text-xl font-bold mb-2">No active sessions</h2>
          <p className="text-slate-500">You haven't booked any sessions yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map(booking => (
            <div key={booking._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex justify-between items-center shadow-sm">
              <div>
                <h3 className="font-bold text-lg mb-1">{booking.service?.title || '1-on-1 Mentorship'}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">with {booking.mentor?.user?.name || 'Mentor'}</p>
                
                <div className="flex gap-4 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1"><Calendar size={14}/> {booking.date}</span>
                  <span className="flex items-center gap-1"><Clock size={14}/> {booking.startTime} - {booking.endTime}</span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className={`px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                  booking.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                  booking.status === 'PENDING_PAYMENT' || booking.status === 'Payment Pending' ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {booking.status}
                </span>

                {(booking.status === 'PENDING_PAYMENT' || booking.status === 'Payment Pending') && (
                  <button 
                    onClick={() => setPaymentBooking(booking)}
                    className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-primary/90"
                  >
                    Pay ₹{booking.amount}
                  </button>
                )}

                {booking.status === 'Confirmed' && booking.meetingLink && (
                  <a 
                    href={booking.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
                  >
                    <Video size={16} /> Join Meeting
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
