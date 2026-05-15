import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'New':
      return 'bg-blue-100 text-blue-800';
    case 'In Progress':
      return 'bg-purple-100 text-purple-800';
    case 'In Transit':
      return 'bg-orange-100 text-orange-800';
    case 'Closed':
      return 'bg-green-100 text-green-800';
    case 'Failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
