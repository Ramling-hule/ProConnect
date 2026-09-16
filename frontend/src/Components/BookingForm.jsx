import React, { useState } from 'react';
import { Paperclip, X } from 'lucide-react';

export default function BookingForm({ onSubmit, isSubmitting, submitText = 'Submit', defaultTopic = '' }) {
  const [formData, setFormData] = useState({
    topic: defaultTopic,
    description: '',
    preferredOutcome: '',
    additionalInfo: '',
    attachments: []
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, { fileName: file.name, fileUrl: URL.createObjectURL(file), fileType: file.type }]
      }));
    }
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Topic <span className="text-red-500">*</span></label>
        <input 
          name="topic" 
          onChange={handleChange} 
          required 
          type="text" 
          value={formData.topic}
          placeholder="What do you want to discuss?" 
          className="w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all bg-slate-50 border-slate-200 focus:ring-brand-primary dark:bg-slate-900 dark:border-slate-700"
        />
      </div>

      <div>
        <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Description <span className="text-red-500">*</span></label>
        <textarea 
          name="description" 
          onChange={handleChange} 
          required 
          rows={3}
          value={formData.description}
          placeholder="Provide more context..." 
          className="w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all bg-slate-50 border-slate-200 focus:ring-brand-primary dark:bg-slate-900 dark:border-slate-700"
        />
      </div>

      <div>
        <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Preferred Outcome <span className="text-red-500">*</span></label>
        <textarea 
          name="preferredOutcome" 
          onChange={handleChange} 
          required 
          rows={2}
          value={formData.preferredOutcome}
          placeholder="What are you looking to achieve?" 
          className="w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all bg-slate-50 border-slate-200 focus:ring-brand-primary dark:bg-slate-900 dark:border-slate-700"
        />
      </div>

      <div>
        <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Additional Info (Optional)</label>
        <input 
          name="additionalInfo" 
          onChange={handleChange} 
          type="text" 
          value={formData.additionalInfo}
          placeholder="Any other details?" 
          className="w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all bg-slate-50 border-slate-200 focus:ring-brand-primary dark:bg-slate-900 dark:border-slate-700"
        />
      </div>

      <div>
        <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Attachments (Optional)</label>
        <div className="flex items-center space-x-2 mb-2">
          <label className="cursor-pointer bg-slate-200 dark:bg-slate-800 px-4 py-2 rounded-xl flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Paperclip size={16} />
            <span className="text-sm font-medium">Attach File</span>
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
        {formData.attachments.length > 0 && (
          <ul className="space-y-2 mt-2">
            {formData.attachments.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-sm">
                <span className="truncate max-w-[200px]">{file.fileName}</span>
                <button type="button" onClick={() => removeAttachment(index)} className="text-red-500 hover:text-red-700">
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full mt-4 p-3 rounded-xl font-bold transition-all bg-brand-primary text-white hover:brightness-110 disabled:opacity-50"
      >
        {isSubmitting ? 'Processing...' : submitText}
      </button>
    </form>
  );
}
