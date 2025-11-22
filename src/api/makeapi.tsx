// import axios from "axios";

// export const makeApi = async (
//   endpoint,
//   method = "GET",
//   data
// ) => {
//   try {
//     const token = localStorage.getItem("token");
    

//     if (!token && endpoint.includes("/auth-required")) {
//       throw new Error("Please login to access this resource.");
//     }

//     const headers = {
//       "Content-Type": "application/json",
//       Authorization: token ? `Bearer ${token}` : ""
//     };

//     const config = {
//       method,
//       // url:"http://localhost:3000"+endpoint,
//       url:"https://resturent-backend-l8jk.onrender.com"+endpoint,
//       // url:"https://restaurant-backend-971455500628.asia-south1.run.app"+endpoint,
//       headers,
//       data
//     };

//     const response = await axios(config);
//     return response;
//   } catch (error) {
//     const message = error.response?.data;
// 		if(message?.error === "Invalid Token.") { 
// 			localStorage.clear();
// 			window.location.href = "/";
// 		}
// 		// Handle subscription expired error
// 		if(message?.subscriptionExpired === true) {
// 			console.error("Subscription expired:", message);
// 			// Error will be caught and handled by the calling component
// 		}
//     console.error("API request failed:", error.response?.data);
//     throw error;
//   }
// };

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
      url: `https://resturent-backend-l8jk.onrender.com${endpoint}`,
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