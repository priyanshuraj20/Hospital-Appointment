import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../config.js";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";
import { authContext } from "../context/AuthContext.jsx";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { dispatch } = useContext(authContext);

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
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || "Login failed");
      }

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: resData.data,
          token: resData.token,
          refreshToken: resData.refreshToken,
          role: resData.role,
        },
      });

      toast.success(resData.message || "Logged in successfully");

      const userRole = (resData.role || "").toUpperCase();
      if (userRole === "DOCTOR") {
        navigate("/doctor/dashboard");
      } else {
        navigate("/my-appointments");
      }
    } catch (err) {
      toast.error(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="px-4 py-16 bg-gray-50 flex items-center justify-center min-h-[75vh]">
      <div className="w-full max-w-[440px] bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <div className="text-center mb-8 border-b pb-6">
          <h3 className="text-headingColor text-2xl font-bold">Welcome Back</h3>
          <p className="text-xs text-textColor mt-1">Sign in to your HealthBridge account</p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
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

          <button
            type="submit"
            className="w-full bg-primaryColor hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-sm transition mt-4"
            disabled={loading}
          >
            {loading ? <HashLoader size={20} color="#fff" /> : "Sign In"}
          </button>

          <p className="text-xs text-textColor text-center mt-4">
            New to HealthBridge?{" "}
            <Link className="text-primaryColor font-bold hover:underline" to="/signup">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default Login;
