import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { LeadStatus } from '../types/crm';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

export default function AddLead() {
  const [loading, setLoading] = useState(false);
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
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3"
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
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3"
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
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Initial Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3"
                >
                  <option value="New">New</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Closed">Closed</option>
                </select>
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
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Consumer Number</label>
                <input
                  value={formData.consumer_number}
                  onChange={(e) => setFormData({ ...formData, consumer_number: e.target.value })}
                  placeholder="ID or Account Number"
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Google Map Location URL</label>
                <input
                  type="url"
                  value={formData.google_maps_url}
                  onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                  placeholder="https://goo.gl/maps/..."
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional notes about the lead..."
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3"
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
