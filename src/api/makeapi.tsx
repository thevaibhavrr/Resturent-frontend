import axios from "axios";

export const makeApi = async (
  endpoint,
  method = "GET",
  data
) => {
  try {
    const token = localStorage.getItem("token");
    

    if (!token && endpoint.includes("/auth-required")) {
      throw new Error("Please login to access this resource.");
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : ""
    };

    const config = {
      method,
      // url:"http://localhost:3000"+endpoint,
      url:"https://resturent-backend-l8jk.onrender.com"+endpoint,
      headers,
      data
    };

    const response = await axios(config);
    return response;
  } catch (error) {
    const message = error.response.data
		if(message.error === "Invalid Token.") {
			localStorage.clear()
			window.location.href = "/";
		}
    console.error("API request failed:", error.response.data);
    throw error;
  }
};