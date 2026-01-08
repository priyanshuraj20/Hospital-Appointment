import { useState } from "react";
import axios from "axios";

const SymptomChecker = ({ onResult }) => {
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!symptoms.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/ai/analyze`,
        { symptoms },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.data.success) {
        onResult(res.data.data);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("AI service failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h3 className="text-xl font-semibold mb-2">AI Symptom Checker</h3>

      <textarea
        className="w-full border p-3 rounded"
        placeholder="Enter symptoms (e.g. fever, chest pain)"
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
      />

      <button
        onClick={handleCheck}
        disabled={loading}
        className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Analyzing..." : "Check"}
      </button>
    </div>
  );
};

export default SymptomChecker;
