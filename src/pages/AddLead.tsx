import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { LeadStatus } from '../types/crm';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronDown, Check, CircleDashed, Activity, Truck, CheckCircle } from 'lucide-react';
import { cn, getStatusColor } from '../lib/utils';

const STATUSES: LeadStatus[] = ['New', 'In Progress', 'In Transit', 'Closed'];

const getStatusIcon = (status: LeadStatus) => {
  switch (status) {
    case 'New': return <CircleDashed size={16} />;
    case 'In Progress': return <Activity size={16} />;
    case 'In Transit': return <Truck size={16} />;
    case 'Closed': return <CheckCircle size={16} />;
  }
};

export default function AddLead() {
  const [loading, setLoading] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone_primary: '',
    location: '',
    phone_secondary: '',
    consumer_number: '',
    google_maps_url: '',
    description: '',
    status: 'New' as LeadStatus,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    const { error } = await supabase.from('customers').insert([{
      ...formData,
      created_by: user.id,
      creator_email: user.email,
    }]);

    if (!error) {
      navigate('/');
    } else {
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full transition-all">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold">New Lead</h1>
      </header>

      <motion.main 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-4 flex-grow"
      >
        <div className="mb-6">
          <p className="text-sm text-gray-500">Fill in the details to capture a new prospect.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Required Fields */}
            <section className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  value={formData.phone_primary}
                  onChange={(e) => setFormData({ ...formData, phone_primary: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, Neighborhood"
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
                />
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-sm font-semibold text-gray-700">
                  Initial Status <span className="text-red-500">*</span>
                </label>
                
                <button
                  type="button"
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-xl border border-gray-200 shadow-sm px-4 py-3 bg-white text-left transition-all",
                    isStatusOpen ? "ring-2 ring-blue-500 border-blue-500" : "hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("p-1 rounded-md", getStatusColor(formData.status as LeadStatus))}>
                      {getStatusIcon(formData.status as LeadStatus)}
                    </span>
                    <span className="font-medium text-gray-700">{formData.status}</span>
                  </div>
                  <ChevronDown size={20} className={cn("text-gray-400 transition-transform", isStatusOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {isStatusOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                    >
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, status });
                            setIsStatusOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn("p-1.5 rounded-lg", getStatusColor(status))}>
                              {getStatusIcon(status)}
                            </span>
                            <span className="font-medium text-gray-700">{status}</span>
                          </div>
                          {formData.status === status && (
                            <Check size={18} className="text-blue-600" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* Optional Fields */}
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 md:hidden mt-2">Additional Information</h2>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Secondary Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone_secondary}
                  onChange={(e) => setFormData({ ...formData, phone_secondary: e.target.value })}
                  placeholder="Optional contact"
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Consumer Number</label>
                <input
                  value={formData.consumer_number}
                  onChange={(e) => setFormData({ ...formData, consumer_number: e.target.value })}
                  placeholder="ID or Account Number"
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Google Map Location URL</label>
                <input
                  type="url"
                  value={formData.google_maps_url}
                  onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                  placeholder="https://goo.gl/maps/..."
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional notes about the lead..."
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
                />
              </div>
            </section>
          </div>

          <footer className="pt-6 flex flex-col gap-3">
            <button
              disabled={loading}
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition duration-200 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Lead'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full bg-white hover:bg-gray-50 text-gray-600 font-semibold py-4 rounded-xl border border-gray-200 transition duration-200 active:bg-gray-100"
            >
              Cancel
            </button>
          </footer>
        </form>
      </motion.main>
    </div>
  );
}
