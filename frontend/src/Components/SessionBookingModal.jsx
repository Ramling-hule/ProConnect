import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import BookingForm from './BookingForm';
import PaymentFlow from './PaymentFlow';
import apiClient from '@/services/apiClient';
import toast from 'react-hot-toast';

export default function SessionBookingModal({ isOpen, onClose, mentorId, username }) {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    if (isOpen && mentorId) {
      setLoadingServices(true);
      apiClient.get(`/api/mentor/${mentorId}/services`)
        .then(res => setServices(res.data.services || []))
        .catch(err => {
          setServices([]);
        })
        .finally(() => setLoadingServices(false));
    } else {
      setStep(1);
      setSelectedService(null);
      setDate('');
      setStartTime('');
    }
  }, [isOpen, mentorId]);

  if (!isOpen) return null;

  const handleBookingSubmit = async (formData) => {
    if (!date || !startTime) {
      toast.error('Please select a date and time slot.');
      return;
    }
    setIsSubmitting(true);
    try {
      const [h, m] = startTime.split(':').map(Number);
      const endM = m + selectedService.duration;
      const endH = h + Math.floor(endM / 60);
      const endTime = `${String(endH % 24).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`;

      const { data } = await apiClient.post('/api/booking', {
        mentorId,
        serviceId: selectedService._id,
        date,
        startTime,
        endTime,
        ...formData
      });
      
      setBookingDetails(data.booking);
      if (data.booking.amount > 0) {
        setStep(3);
      } else {
        toast.success('Session booked successfully!');
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to book session');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold">
            {step === 1 && `Book Session with ${username}`}
            {step === 2 && 'Complete Booking Details'}
            {step === 3 && 'Complete Payment'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">Select a Service</h3>
              {loadingServices ? (
                <div className="text-center p-4">Loading services...</div>
              ) : services.length === 0 ? (
                <div className="text-center p-4 text-slate-500">No services available.</div>
              ) : (
                services.map(s => (
                  <div 
                    key={s._id} 
                    onClick={() => { setSelectedService(s); setStep(2); }}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:border-brand-primary transition-colors flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-bold">{s.title}</h4>
                      <p className="text-sm text-slate-500">{s.duration} mins • {s.description}</p>
                    </div>
                    <div className="font-bold text-brand-primary">₹{s.price}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {step === 2 && selectedService && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex justify-between">
                <div>
                  <h4 className="font-bold text-sm">{selectedService.title}</h4>
                  <p className="text-xs text-slate-500">{selectedService.duration} mins</p>
                </div>
                <div className="font-bold text-sm">₹{selectedService.price}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Date <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input 
                      type="date" 
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border outline-none focus:ring-2 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Start Time <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input 
                      type="time" 
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border outline-none focus:ring-2 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700" 
                    />
                  </div>
                </div>
              </div>

              <BookingForm 
                onSubmit={handleBookingSubmit} 
                isSubmitting={isSubmitting} 
                submitText={`Book for ₹${selectedService.price}`}
              />
            </div>
          )}

          {step === 3 && bookingDetails && (
            <PaymentFlow 
              type="session"
              entityId={bookingDetails._id}
              amount={bookingDetails.amount}
              onSuccess={() => {
                onClose();
              }}
              onCancel={() => {
                setStep(2);
                toast.error('Payment cancelled');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
