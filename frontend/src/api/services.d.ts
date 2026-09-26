export interface UploadImageOptions {
  modality?: string;
  sensor_type?: string;
  bounds?: any;
  user_id?: string;
}

export interface UploadImageResponse {
  image_id: string;
  url: string;
  storage_path: string;
  file_name: string;
  format?: string;
  modality?: string;
  sensor_type?: string;
  bounds?: any;
  resolution_m?: number;
  metadata?: Record<string, any>;
}

export declare const uploadImage: (file: File, options?: UploadImageOptions) => Promise<UploadImageResponse>;
export declare const loginUser: (data: any) => Promise<any>;
export declare const analyzeImage: (data: any) => Promise<any>;
export declare const detectChange: (data: any) => Promise<any>;
export declare const getHistory: () => Promise<any>;
export declare const getAgents: () => Promise<any>;
export declare const getTraceDetail: (traceId: string) => Promise<any>;
export declare const checkHealth: () => Promise<any>;
export declare const checkDbHealth: () => Promise<any>;
