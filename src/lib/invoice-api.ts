import api from './api';

export interface Invoice {
  startDate: string;      // "2025-11-24"
  endDate: string;        // "2025-12-24"
  packageName: string;    // "PREMIUM"
  amount: number;         // 199000
}

export interface InvoiceListItem extends Invoice {
  id: number;
  status: string;
  cancelledAt: string | null;
  isActive: boolean;
}

export interface InvoiceResponse {
  code: number;
  message: string;
  result: Invoice;
}

export interface InvoiceListItemResponse {
  code: number;
  message: string;
  result: InvoiceListItem;
}

export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface InvoiceHistoryResponse {
  code: number;
  message: string;
  result: PageResponse<InvoiceListItem>;
}

/**
 * Candidate: get active invoice
 * GET /api/candidate-invoice/my-invoice
 */
export const getMyInvoice = async (): Promise<Invoice | null> => {
  try {
    const response = await api.get<InvoiceResponse>('/api/candidate-invoice/my-invoice');
    
    if (response.data.code === 200) {
      return response.data.result;
    }
    
    // If not success code, return null
    return null;
  } catch (error: any) {
    // 404 means no invoice found - this is expected for new users
    if (error.response?.status === 404) {
      console.log('ℹ️ No invoice found for user (404) - this is normal for new users');
      return null;
    }
    
    // Log other errors but don't crash
    console.error('❌ Error fetching invoice:', error.response?.data?.message || error.message);
    return null;
  }
};

/**
 * Candidate: get invoice history (paged)
 * GET /api/candidate-invoice/my-invoices?page=&size=
 */
export const getCandidateInvoiceHistory = async (
  page = 0,
  size = 20
): Promise<PageResponse<InvoiceListItem>> => {
  const response = await api.get<InvoiceHistoryResponse>(
    "/api/candidate-invoice/my-invoices",
    { params: { page, size } }
  );

  if (response.data.code === 200) {
    return response.data.result;
  }

  return {
    content: [],
    number: page,
    size,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  };
};

/**
 * Candidate: get invoice detail by id
 * GET /api/candidate-invoice/my-invoices/{id}
 */
export const getCandidateInvoiceById = async (
  id: number
): Promise<InvoiceListItem | null> => {
  try {
    const response = await api.get<InvoiceListItemResponse>(
      `/api/candidate-invoice/my-invoices/${id}`
    );

    if (response.data.code === 200) {
      return response.data.result;
    }

    return null;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    console.error(
      "❌ Error fetching candidate invoice detail:",
      error.response?.data?.message || error.message
    );
    return null;
  }
};

/**
 * Get recruiter's invoice/transaction history
 * GET /api/recruiter-invoice/my-invoice
 *
 * Returns null if user has no invoice (404)
 */
export const getMyRecruiterInvoice = async (): Promise<Invoice | null> => {
  try {
    const response = await api.get<InvoiceResponse>("/api/recruiter-invoice/my-invoice");

    if (response.data.code === 200) {
      return response.data.result;
    }

    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log("ℹ️ No invoice found for recruiter (404) - this is normal for new users");
      return null;
    }

    console.error(
      "❌ Error fetching recruiter invoice:",
      error.response?.data?.message || error.message
    );
    return null;
  }
};

/**
 * Recruiter: get invoice history (paged)
 * GET /api/recruiter-invoice/my-invoices?page=&size=
 */
export const getRecruiterInvoiceHistory = async (
  page = 0,
  size = 20
): Promise<PageResponse<InvoiceListItem>> => {
  const response = await api.get<InvoiceHistoryResponse>(
    "/api/recruiter-invoice/my-invoices",
    { params: { page, size } }
  );

  if (response.data.code === 200) {
    return response.data.result;
  }

  return {
    content: [],
    number: page,
    size,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  };
};

/**
 * Recruiter: get invoice detail by id
 * GET /api/recruiter-invoice/my-invoices/{id}
 */
export const getRecruiterInvoiceById = async (
  id: number
): Promise<InvoiceListItem | null> => {
  try {
    const response = await api.get<InvoiceListItemResponse>(
      `/api/recruiter-invoice/my-invoices/${id}`
    );

    if (response.data.code === 200) {
      return response.data.result;
    }

    return null;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    console.error(
      "❌ Error fetching recruiter invoice detail:",
      error.response?.data?.message || error.message
    );
    return null;
  }
};

/**
 * Format date from YYYY-MM-DD to readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

/**
 * Format price in VND
 */
export const formatInvoicePrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};
