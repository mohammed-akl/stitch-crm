import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Customer, LeadStatus } from '../types/crm';
import { cn, getStatusColor } from '../lib/utils';
import { Search, Phone, Plus, User, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TABS: (LeadStatus | 'All')[] = ['All', 'New', 'In Progress', 'In Transit', 'Closed'];

export default function Dashboard() {
  const [leads, setLeads] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LeadStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLeads(data);
    }
    setLoading(false);
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesTab = activeTab === 'All' || lead.status === activeTab;
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         lead.consumer_number?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex flex-col flex-1 max-w-2xl mx-auto w-full">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20 px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Leads</h1>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <Search size={22} />
          </button>
        </div>

        {/* Search Bar (Optional, can be toggled) */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all"
          />
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all",
                activeTab === tab 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                  : "text-gray-500 hover:bg-gray-100"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 overflow-y-auto min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 font-medium">Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <User size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">No leads found</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredLeads.map((lead) => (
                <motion.div
                  key={lead.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 transition-all group active:scale-[0.99]"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {lead.name}
                      </h2>
                      <p className="text-xs font-medium text-gray-400 mt-0.5 uppercase tracking-wider">
                        ID: {lead.consumer_number || 'N/A'}
                      </p>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      getStatusColor(lead.status)
                    )}>
                      {lead.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-5">
                    <MapPin size={14} className="flex-shrink-0" />
                    <p className="truncate">{lead.location}</p>
                  </div>

                  <div className="flex gap-2">
                    <a 
                      href={`tel:${lead.phone_primary}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 active:scale-95 transition-all shadow-md shadow-emerald-100"
                    >
                      <Phone size={18} fill="white" />
                      <span>Call Now</span>
                    </a>
                    <button 
                      className="flex-1 bg-gray-50 text-gray-600 border border-gray-100 font-bold py-3 rounded-xl hover:bg-gray-100 active:scale-95 transition-all"
                    >
                      Change Status
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => navigate('/add-lead')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-200 hover:scale-110 active:scale-95 transition-all z-30"
      >
        <Plus size={28} />
      </button>

      {/* Footer Navigation (Mock) */}
      <nav className="bg-white border-t flex justify-around py-3">
        <button className="flex flex-col items-center gap-1 text-blue-600">
          <div className="h-1 w-6 bg-blue-600 rounded-full mb-1" />
          <Search size={22} />
          <span className="text-[10px] font-bold uppercase">Dashboard</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <User size={22} />
          <span className="text-[10px] font-bold uppercase">Customers</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <Plus size={22} />
          <span className="text-[10px] font-bold uppercase">Settings</span>
        </button>
      </nav>
    </div>
  );
}
