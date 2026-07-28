import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../config.js";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "PATIENT",
    specialization: "General Physician",
    qualification: "MBBS",
    consultationFee: 500,
  });

  const navigate = useNavigate();

  const handleInputData = (event) => {
    setFormData((prevState) => ({
      ...prevState,
      [event.target.name]: event.target.value,
    }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || "Registration failed");
      }

      toast.success(resData.message || "Registration successful! Please log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="px-4 py-16 bg-gray-50 flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-[480px] bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <div className="text-center mb-6 border-b pb-4">
          <h3 className="text-headingColor text-2xl font-bold">Create Account</h3>
          <p className="text-xs text-textColor mt-1">Register for HealthBridge appointment access</p>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, role: "PATIENT" })}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              formData.role === "PATIENT" ? "bg-primaryColor text-white shadow-sm" : "text-textColor hover:text-headingColor"
            }`}
          >
            Patient Account
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, role: "DOCTOR" })}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              formData.role === "DOCTOR" ? "bg-primaryColor text-white shadow-sm" : "text-textColor hover:text-headingColor"
            }`}
          >
            Doctor Profile
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-headingColor block mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Dr. John Doe / Jane Smith"
              name="name"
              value={formData.name}
              onChange={handleInputData}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:border-primaryColor focus:bg-white transition"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-headingColor block mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              name="email"
              value={formData.email}
              onChange={handleInputData}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:border-primaryColor focus:bg-white transition"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-headingColor block mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              name="password"
              value={formData.password}
              onChange={handleInputData}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:border-primaryColor focus:bg-white transition"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-headingColor block mb-1">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="+91 9876543210"
              name="phone"
              value={formData.phone}
              onChange={handleInputData}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:border-primaryColor focus:bg-white transition"
            />
          </div>

          {/* Doctor-specific fields */}
          {formData.role === "DOCTOR" && (
            <>
              <div>
                <label className="text-xs font-bold text-headingColor block mb-1">
                  Specialization
                </label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputData}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:border-primaryColor"
                >
                  <option value="General Physician">General Physician</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-headingColor block mb-1">
                    Qualification
                  </label>
                  <input
                    type="text"
                    placeholder="MBBS, MD"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputData}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:border-primaryColor focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-headingColor block mb-1">
                    Fee (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="500"
                    name="consultationFee"
                    value={formData.consultationFee}
                    onChange={handleInputData}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:border-primaryColor focus:bg-white"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-primaryColor hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-sm transition mt-4"
            disabled={loading}
          >
            {loading ? <HashLoader size={20} color="#fff" /> : "Register"}
          </button>

          <p className="text-xs text-textColor text-center mt-4">
            Already have an account?{" "}
            <Link className="text-primaryColor font-bold hover:underline" to="/login">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default Signup;
