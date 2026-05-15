import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Customer, Attachment, LeadStatus } from '../types/crm';
import { cn, getStatusColor } from '../lib/utils';
import { 
  ArrowLeft, Edit2, MapPin, Phone, FileText, ExternalLink, 
  Upload, X, Check, AlertCircle, Share2, Navigation, Eye, Download,
  ChevronDown, CircleDashed, Activity, Truck, CheckCircle, XCircle, Copy, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const STATUSES: LeadStatus[] = ['New', 'In Progress', 'In Transit', 'Closed', 'Failed'];
const FAILED_REASONS = ['Price too high', 'Went with competitor', 'Unresponsive', 'Not a good fit', 'Other'];

const getStatusIcon = (status: LeadStatus) => {
  switch (status) {
    case 'New': return <CircleDashed size={16} />;
    case 'In Progress': return <Activity size={16} />;
    case 'In Transit': return <Truck size={16} />;
    case 'Closed': return <CheckCircle size={16} />;
    case 'Failed': return <XCircle size={16} />;
  }
};

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  
  // Status Update State
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isReasonOpen, setIsReasonOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<LeadStatus | ''>('');
  const [failedReason, setFailedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [isKwOpen, setIsKwOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  async function fetchData() {
    setLoading(true);
    const [cRes, aRes] = await Promise.all([
      supabase.from('customers').select('*').eq('id', id).single(),
      supabase.from('attachments').select('*').eq('customer_id', id).order('created_at', { ascending: false })
    ]);

    if (!cRes.error && cRes.data) {
      setCustomer(cRes.data);
      setNewStatus(cRes.data.status);
      if (cRes.data.status === 'Failed' && cRes.data.failed_reason) {
        const REASONS = ['Price too high', 'Went with competitor', 'Unresponsive', 'Not a good fit'];
        if (REASONS.includes(cRes.data.failed_reason)) {
          setFailedReason(cRes.data.failed_reason);
        } else {
          setFailedReason('Other');
          setOtherReason(cRes.data.failed_reason);
        }
      }
    }
    if (!aRes.error && aRes.data) {
      setAttachments(aRes.data);
    }
    setLoading(false);
  }

  const handleUpdateStatus = async () => {
    if (!customer || !newStatus) return;
    if (newStatus === 'Failed' && !failedReason) {
      alert('Please select a reason for losing the lead.');
      return;
    }
    if (newStatus === 'Failed' && failedReason === 'Other' && !otherReason) {
      alert('Please specify the reason.');
      return;
    }
    
    setLoading(true);
    const updateData: Partial<Customer> = { status: newStatus as LeadStatus };
    if (newStatus === 'Failed') {
      updateData.failed_reason = failedReason === 'Other' ? otherReason : failedReason;
    } else {
      updateData.failed_reason = null; // Clear if not Failed
    }

    const { error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', customer.id);

    if (!error) {
      setCustomer({ ...customer, ...updateData } as Customer);
    } else {
      alert(error.message);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !id) return;

    setUploading(true);
    setUploadErrors({});
    
    const fileArray = Array.from(files) as File[];
    
    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        setUploadErrors(prev => ({ ...prev, [file.name]: 'File exceeds 5MB limit' }));
        continue;
      }

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${id}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('bill-attachments')
          .upload(filePath, file, {
            onUploadProgress: (progress: any) => {
              const percent = (progress.loaded / progress.total) * 100;
              setUploadProgress(prev => ({ ...prev, [file.name]: percent }));
            }
          } as any);

        if (uploadError) throw uploadError;

        // Save metadata to database
        const { error: dbError } = await supabase.from('attachments').insert({
          customer_id: id,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size
        });

        if (dbError) throw dbError;

        // Refresh attachments
        fetchData();
      } catch (err: any) {
        setUploadErrors(prev => ({ ...prev, [file.name]: err.message }));
      }
    }
    
    setUploading(false);
    setUploadProgress({});
  };

  const handleDownload = async (attachment: Attachment) => {
    const { data, error } = await supabase.storage
      .from('bill-attachments')
      .download(attachment.file_path);

    if (error) {
      alert(error.message);
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleView = (attachment: Attachment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const { data } = supabase.storage
      .from('bill-attachments')
      .getPublicUrl(attachment.file_path);
    
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getShareText = () => {
    if (!customer) return '';
    return `Greencell solar energy solutions - kuttippuram
-----------------------------------
Customer details

Name: ${customer.name}
Phone (Primary): ${customer.phone_primary}${customer.phone_secondary ? `\nPhone (Secondary): ${customer.phone_secondary}` : ''}
Consumer Number: ${customer.consumer_number || 'N/A'}
Location: ${customer.location}${customer.pincode ? `\nPincode: ${customer.pincode}` : ''}${customer.google_maps_url ? `\nGoogle Maps: ${customer.google_maps_url}` : ''}
Status: ${customer.status}${customer.kilo_watt ? `\nKW Preference: ${customer.kilo_watt}` : ''}${customer.description ? `\nDescription: ${customer.description}` : ''}`;
  };

  const handleShare = async () => {
    if (!customer) return;
    try {
      await navigator.share({
        title: `Lead: ${customer.name}`,
        text: getShareText()
      });
    } catch (err) {
      console.log('Sharing failed', err);
    }
  };

  const handleCopy = async () => {
    if (!customer) return;
    try {
      await navigator.clipboard.writeText(getShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.log('Copy failed', err);
    }
  };

  if (loading && !customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return <div className="p-10 text-center">Customer not found</div>;
  }

  return (
    <div className="flex flex-col flex-1 w-full bg-gray-50 min-h-screen">
      {/* Navbar */}
      <header className="bg-white border-b sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/')}
            className="p-2 -ml-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-all flex items-center"
          >
            <ArrowLeft size={18} className="mr-1" /> Back
          </button>
          <h1 className="text-lg font-bold">Lead Details</h1>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={cn(
            "flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold transition-all active:scale-95",
            isEditing 
              ? "border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300" 
              : "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:shadow-sm"
          )}
        >
          {isEditing ? (
            <>
              <X size={16} />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Edit2 size={16} />
              <span>Edit Lead</span>
            </>
          )}
        </button>
      </header>

      <main className="p-4 flex-grow overflow-y-auto pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 space-y-5"
        >
          {/* Header Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-2xl font-bold">
              {customer.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  getStatusColor(customer.status)
                )}>
                  {customer.status}
                </span>
                {customer.kilo_watt && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-[10px] font-bold tracking-widest shadow-sm border border-yellow-200">
                    <Zap size={10} className="text-yellow-500" fill="currentColor" />
                    {customer.kilo_watt}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 pt-2 border-b pb-6">
            {/* Phone numbers */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Numbers</span>
              <div className="flex flex-col gap-1">
                <a href={`tel:${customer.phone_primary}`} className="text-blue-600 font-semibold">{customer.phone_primary} (Primary)</a>
                {customer.phone_secondary && (
                  <a href={`tel:${customer.phone_secondary}`} className="text-blue-600 font-semibold">{customer.phone_secondary} (Secondary)</a>
                )}
              </div>
            </div>

            {/* Consumer Number */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Consumer Number</span>
              <p className="text-gray-900 font-medium">{customer.consumer_number || '#N/A'}</p>
            </div>

            {/* Location */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</span>
              <p className="text-gray-700 text-sm">{customer.location}</p>
            </div>

            {/* Pincode */}
            {customer.pincode && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pincode</span>
                <p className="text-gray-900 font-medium">{customer.pincode}</p>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</span>
              <p className="text-gray-600 text-sm leading-relaxed">
                {customer.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Documents */}
          <div className="pt-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Attached Documents</span>
            <div className="space-y-2">
              {attachments.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No documents attached.</p>
              ) : (
                attachments.map((file) => (
                  <div 
                    key={file.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 transition-all"
                  >
                    <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{file.file_name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">Added on {new Date(file.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => handleView(file, e)}
                        className="p-3 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                        title="View File"
                      >
                        <Eye size={20} />
                      </button>
                      <button 
                        onClick={() => handleDownload(file)}
                        className="p-3 text-gray-500 hover:bg-gray-200 rounded-xl transition-all"
                        title="Download File"
                      >
                        <Download size={20} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.section>
        </div>

        <div className="space-y-6">
          {/* Global Actions */}
          <div className="grid grid-cols-1 gap-3">
          {customer.google_maps_url && (
            <a 
              href={customer.google_maps_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all"
            >
              <Navigation size={20} />
              Navigate to Google Maps
            </a>
          )}
          <button 
            onClick={handleShare}
            className="flex items-center justify-center gap-3 bg-white text-gray-800 border-2 border-gray-100 font-bold py-4 rounded-2xl hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            <Share2 size={20} className="text-blue-600" />
            Share Details
          </button>
          
          <button 
            onClick={handleCopy}
            className="flex items-center justify-center gap-3 bg-white text-gray-800 border-2 border-gray-100 font-bold py-4 rounded-2xl hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            {copied ? (
              <>
                <Check size={20} className="text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={20} className="text-gray-500" />
                <span>Copy Details</span>
              </>
            )}
          </button>
        </div>

        {/* Closing Lead Module */}
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-4">Update Status & Docs</h3>
          
          <div className="space-y-4">
            <div className="relative z-10">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Select Outcome</label>
              
              <button
                type="button"
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className={cn(
                  "w-full flex items-center justify-between rounded-xl border border-gray-200 shadow-sm px-4 py-3 bg-white text-left transition-all",
                  isStatusOpen ? "ring-2 ring-blue-500 border-blue-500" : "hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-2">
                  {newStatus ? (
                    <>
                      <span className={cn("p-1 rounded-md", getStatusColor(newStatus as LeadStatus))}>
                        {getStatusIcon(newStatus as LeadStatus)}
                      </span>
                      <span className="font-medium text-gray-700">{newStatus}</span>
                    </>
                  ) : (
                    <span className="font-medium text-gray-400">-- Choose Status --</span>
                  )}
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
                          setNewStatus(status);
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
                        {newStatus === status && (
                          <Check size={18} className="text-blue-600" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {newStatus === 'Failed' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 pt-2">
                <div className="relative z-[9]">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Reason for Losing</label>
                  
                  <button
                    type="button"
                    onClick={() => setIsReasonOpen(!isReasonOpen)}
                    className={cn(
                      "w-full flex items-center justify-between rounded-xl border border-gray-200 shadow-sm px-4 py-3 bg-white text-left transition-all",
                      isReasonOpen ? "ring-2 ring-red-500 border-red-500" : "hover:border-gray-300"
                    )}
                  >
                    <span className={cn("font-medium", failedReason ? "text-gray-700" : "text-gray-400")}>
                      {failedReason || "-- Select Reason --"}
                    </span>
                    <ChevronDown size={20} className={cn("text-gray-400 transition-transform", isReasonOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isReasonOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                      >
                        {FAILED_REASONS.map((reason) => (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => {
                              setFailedReason(reason);
                              setIsReasonOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-50 transition-colors text-left"
                          >
                            <span className={cn("font-medium", failedReason === reason ? "text-red-700" : "text-gray-700")}>
                              {reason}
                            </span>
                            {failedReason === reason && (
                              <Check size={18} className="text-red-600" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {failedReason === 'Other' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Specify Reason</label>
                    <textarea 
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      placeholder="Please provide details..."
                      rows={3}
                      className="w-full rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 text-sm px-4 py-3 font-medium text-gray-700"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Document Upload Area */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Upload Documents</label>
              <div className="relative">
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileUpload}
                  className="hidden" 
                  id="file-upload"
                  disabled={uploading}
                />
                <label 
                  htmlFor="file-upload"
                  className={cn(
                    "border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 hover:border-blue-300 transition-all cursor-pointer group",
                    uploading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Upload size={32} className="text-gray-400 group-hover:text-blue-500 transition-colors mb-2" />
                  <p className="text-sm text-gray-700 font-bold">Tap to upload files</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-medium tracking-wide">PDF, PNG, JPG UP TO 5MB</p>
                </label>
              </div>

              {/* Upload Progress/Status */}
              <div className="mt-4 space-y-2">
                {(Object.entries(uploadProgress) as [string, number][]).map(([name, progress]) => (
                  <div key={name} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-gray-700 truncate mr-2">{name}</span>
                      <span className="text-[10px] font-bold text-blue-600">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-blue-600"
                      />
                    </div>
                  </div>
                ))}
                {Object.entries(uploadErrors).map(([name, error]) => (
                  <div key={name} className="bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2 text-red-600">
                    <AlertCircle size={14} />
                    <span className="text-xs font-bold truncate">{name}: {error}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleUpdateStatus}
              disabled={loading || !newStatus}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Lead Status'}
            </button>
          </div>
        </section>
        </div>
      </div>
    </main>

      {/* Edit Overlay */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-50 bg-white flex flex-col pt-safe"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">Edit Lead Info</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="flex-grow p-4 overflow-y-auto space-y-6">
              {/* Form implementation for editing - reusing logic from AddLead potentially or just simple inputs */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Name</label>
                  <input 
                    defaultValue={customer.name} 
                    onChange={(e) => setCustomer({...customer, name: e.target.value})}
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Phone Primary</label>
                  <input 
                    defaultValue={customer.phone_primary} 
                    onChange={(e) => setCustomer({...customer, phone_primary: e.target.value})}
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Phone Secondary</label>
                  <input 
                    defaultValue={customer.phone_secondary || ''} 
                    onChange={(e) => setCustomer({...customer, phone_secondary: e.target.value})}
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Consumer Number</label>
                  <input 
                    defaultValue={customer.consumer_number || ''} 
                    onChange={(e) => setCustomer({...customer, consumer_number: e.target.value})}
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
                    placeholder="ID or Account Number"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Location</label>
                  <textarea 
                    defaultValue={customer.location} 
                    onBlur={(e) => setCustomer({...customer, location: e.target.value})}
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
                    rows={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Pincode</label>
                  <input 
                    defaultValue={customer.pincode || ''} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCustomer({...customer, pincode: val});
                      e.target.value = val;
                    }}
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
                    placeholder="6 digit pincode"
                  />
                </div>
                <div className="space-y-1.5 relative">
                  <label className="text-sm font-semibold text-gray-700">Kilo Watt (KW) Preference</label>
                  
                  <button
                    type="button"
                    onClick={() => setIsKwOpen(!isKwOpen)}
                    className={cn(
                      "w-full flex items-center justify-between rounded-xl border border-gray-200 shadow-sm px-4 py-3 bg-white text-left transition-all",
                      isKwOpen ? "ring-2 ring-yellow-500 border-yellow-500" : "hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-md bg-yellow-100 text-yellow-600">
                        <Zap size={16} fill="currentColor" />
                      </span>
                      <span className="font-medium text-gray-700">
                        {customer.kilo_watt || 'Select KW'}
                      </span>
                    </div>
                    <ChevronDown size={20} className={cn("text-gray-400 transition-transform", isKwOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isKwOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-h-60 overflow-y-auto"
                      >
                        {Array.from({ length: 20 }, (_, i) => `${i + 1}KW`).map((kw) => (
                          <button
                            key={kw}
                            type="button"
                            onClick={() => {
                              setCustomer({ ...customer, kilo_watt: kw });
                              setIsKwOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-yellow-50 transition-colors border-b border-gray-50 last:border-0"
                          >
                            <span className="font-semibold text-gray-700">{kw}</span>
                            {customer.kilo_watt === kw && (
                              <Check size={16} className="text-yellow-600" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Google Maps URL</label>
                  <input 
                    type="url"
                    defaultValue={customer.google_maps_url || ''} 
                    onChange={(e) => setCustomer({...customer, google_maps_url: e.target.value})}
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
                    placeholder="https://goo.gl/maps/..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Description</label>
                  <textarea 
                    defaultValue={customer.description || ''} 
                    onBlur={(e) => setCustomer({...customer, description: e.target.value})}
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
                    rows={4}
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-white">
              <button 
                onClick={async () => {
                  setLoading(true);
                  const { error } = await supabase.from('customers').update(customer).eq('id', customer.id);
                  if (!error) setIsEditing(false);
                  setLoading(false);
                }}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
