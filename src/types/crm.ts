export type LeadStatus = 'New' | 'In Progress' | 'In Transit' | 'Closed';

export interface Customer {
  id: string;
  created_at: string;
  name: string;
  status: LeadStatus;
  phone_primary: string;
  phone_secondary?: string;
  consumer_number?: string;
  location: string;
  description?: string;
  google_maps_url?: string;
  created_by: string;
}

export interface Attachment {
  id: string;
  customer_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  created_at: string;
}
