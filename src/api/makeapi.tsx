import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  subscriptionExpired?: boolean;
  [key: string]: any;
}

export const makeApi = async <T = any>(
  endpoint: string,
  method: AxiosRequestConfig['method'] = "GET",
  data?: any
): Promise<AxiosResponse<T>> => {
  try {
    const token = localStorage.getItem("token");

    if (!token && endpoint.includes("/auth-required")) {
      throw new Error("Please login to access this resource.");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    };

    const config: AxiosRequestConfig = {
      method,
      // url: `https://resturent-backend-l8jk.onrender.com${endpoint}`,
      url: `https://striking-prosperity-production.up.railway.app${endpoint}`,
      // url: `http://localhost:3000${endpoint}`,  
      headers,
      data
    };

    const response = await axios.request<T>(config);
    return response;
  } catch (error) {
    const axiosError = error as AxiosError<ApiResponse>;
    const errorData = axiosError.response?.data;

    if (errorData?.error === "Invalid Token.") { 
      localStorage.clear();
      window.location.href = "/";
      throw new Error("Session expired. Please login again.");
    }

    if (errorData?.subscriptionExpired === true) {
      console.error("Subscription expired:", errorData);
      throw new Error("Your subscription has expired.");
    }

    console.error("API request failed:", errorData || error);
    throw error;
  }
};