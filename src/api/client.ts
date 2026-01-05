import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { ApiResponse } from '../types';
import { removeUserFromStorage } from '../utils/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 401 에러 인터셉터: 세션 만료 시 자동 로그아웃 처리
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // 세션이 만료된 경우 localStorage 정리 및 이벤트 발생
      removeUserFromStorage();
      // 커스텀 이벤트를 발생시켜 AuthContext에서 감지할 수 있도록 함
      window.dispatchEvent(new CustomEvent('session-expired'));
    }
    return Promise.reject(error);
  }
);

// 에러 타입 정의
export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

// API 에러 처리 헬퍼
export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<any>>;
    return {
      message: axiosError.response?.data?.message || axiosError.message || '알 수 없는 오류가 발생했습니다.',
      status: axiosError.response?.status,
      data: axiosError.response?.data,
    };
  }
  return {
    message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
  };
};

// API 응답 래퍼
export const unwrapApiResponse = <T>(response: { data: ApiResponse<T> }): T => {
  return response.data.data;
};

