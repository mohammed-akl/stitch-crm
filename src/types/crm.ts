export type LeadStatus = 'New' | 'In Progress' | 'In Transit' | 'Closed' | 'Failed';

export interface Customer {
  id: string;
  created_at: string;
  name: string;
  status: LeadStatus;
  phone_primary: string;
  phone_secondary?: string;
  consumer_number?: string;
  location: string;
  pincode?: string;
  kilo_watt?: string;
  description?: string;
  google_maps_url?: string;
  failed_reason?: string;
  created_by: string;
  creator_email?: string;
}

export interface Attachment {
  id: string;
  customer_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  created_at: string;
}
