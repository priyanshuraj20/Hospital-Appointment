import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", // backend URL
});

// AI symptom analysis
export const analyzeSymptoms = (symptoms, token) => {
  return API.post(
    "/ai/analyze",
    { symptoms },
    {
      headers: {
        Authorization: `Bearer ${token}`, // user logged-in token
      },
    }
  );
};

export default API;
