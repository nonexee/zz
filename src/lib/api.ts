// src/lib/api.ts - API client for EASM backend
const API_BASE_URL = '/api'; // Use relative URL - Next.js will proxy to backend

// Types for API responses
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  organizationId: string;
  active: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  primaryDomain: string;
  apexDomains: string[];
  apexDomainsCount: number;
  status: string;
  lastScanTime?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  organization: Organization;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export interface InventoryStats {
  organization: Organization & {
    nextScanTime?: string;
    needsRescan?: boolean;
  };
  lastScan?: {
    id: string;
    scanDate: string;
    completionDate: string;
    summary: {
      totalDomains: number;
      newDomains: number;
      totalIps: number;
      newIps: number;
      totalOpenPorts: number;
      newOpenPorts: number;
      totalServices: number;
      newServices: number;
      totalEndpoints: number;
      newEndpoints: number;
    };
  };
  stats: {
    domains: number;
    ips: {
      total: number;
      active: number;
    };
    ports: number;
    services: number;
    endpoints: number;
    tls: number;
    portDistribution: Array<{
      port: number;
      count: number;
    }>;
    apexDomains: Array<{
      domain: string;
      subdomainCount: number;
    }>;
  };
}

export interface AssetTrendsResponse {
  data: Array<{
    date: string;
    domains: number;
    newDomains: number;
    apexDomains: number;
    ips: number;
    newIps: number;
    activeIps: number;
    ports: number;
    newPorts: number;
    endpoints: number;
    newEndpoints: number;
    httpsEndpoints: number;
    totalAssets: number;
    cumulativeDomains: number;
    cumulativeIps: number;
    cumulativePorts: number;
    cumulativeEndpoints: number;
    cumulativeTotal: number;
  }>;
  summary: {
    period: string;
    granularity: string;
    totalDataPoints: number;
    dateRange: {
      start: string;
      end: string;
    };
    totals: {
      domainsDiscovered: number;
      ipsDiscovered: number;
      portsDiscovered: number;
      endpointsDiscovered: number;
    };
    currentTotals: {
      domains: number;
      ips: number;
      ports: number;
      endpoints: number;
    };
  };
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    // Get token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle different response types
      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = { message: await response.text() };
        }
        
        // Handle specific HTTP status codes
        if (response.status === 401) {
          // Token expired or invalid - clear auth and redirect
          this.logout();
          throw new Error('Your session has expired. Please log in again.');
        }
        
        if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to perform this action.');
        }
        
        if (response.status === 404) {
          throw new Error('The requested resource was not found.');
        }
        
        if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return {} as T;
      }
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      
      // Network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      throw error;
    }
  }

  // Auth methods
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
    apexDomains: string[];
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
    }
    this.token = response.tokens.accessToken;
    
    return response;
  }

  async verifyToken(): Promise<{ user: User; organization: Organization }> {
    return this.request<{ user: User; organization: Organization }>('/auth/verify');
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('isAuthenticated');
    }
    this.token = null;
  }

  // Inventory methods
  async getInventoryStats(): Promise<InventoryStats> {
    return this.request<InventoryStats>('/inventory/stats');
  }

  async getAssetDiscoveryTrends(params: {
    period?: '7d' | '30d' | '90d';
    granularity?: 'hourly' | 'daily';
  } = {}): Promise<AssetTrendsResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value);
      }
    });
    
    return this.request(`/inventory/trends?${searchParams.toString()}`);
  }

  async searchAssets(query: string): Promise<{
    query: string;
    results: {
      domains: any[];
      ips: any[];
      endpoints: any[];
      services: any[];
    };
    totalResults: number;
  }> {
    return this.request(`/inventory/search?query=${encodeURIComponent(query)}`);
  }

  async getAssetsList(params: {
    type?: 'domain' | 'ip';
    status?: 'active' | 'inactive' | 'all';
    page?: number;
    limit?: number;
  } = {}): Promise<{
    organization: Organization;
    assets: any[];
    totals: {
      domains: number;
      ips: number;
      combined: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    return this.request(`/inventory/assets?${searchParams.toString()}`);
  }

  async getAssetDetail(assetType: 'domain' | 'ip', assetId: string): Promise<any> {
    return this.request(`/inventory/asset/${assetType}/${assetId}`);
  }

  async getNetworkVisualization(assetId?: string): Promise<{
    nodes: any[];
    edges: any[];
    stats: any;
    centerAsset?: any;
  }> {
    const endpoint = assetId ? `/inventory/network/${assetId}` : '/inventory/network';
    return this.request(endpoint);
  }

  // Organization methods
  async getOrganization(): Promise<Organization & {
    scanSettings: any;
    lastScanTime?: string;
    nextScanTime?: string;
    needsRescan?: boolean;
    createdAt: string;
    updatedAt: string;
  }> {
    return this.request('/organization');
  }

  async addApexDomain(domain: string): Promise<{
    message: string;
    domain: string;
    apexDomains: string[];
    apexDomainsCount: number;
  }> {
    return this.request('/organization/apex-domains', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  }

  async removeApexDomain(domain: string): Promise<{
    message: string;
    removedDomain: string;
    apexDomains: string[];
    apexDomainsCount: number;
    primaryDomain: string;
  }> {
    return this.request(`/organization/apex-domains/${encodeURIComponent(domain)}`, {
      method: 'DELETE',
    });
  }

  async updateOrganization(data: {
    name?: string;
    scanSettings?: any;
  }): Promise<{
    message: string;
    organization: Organization;
  }> {
    return this.request('/organization', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
