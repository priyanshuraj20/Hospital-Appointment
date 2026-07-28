import { useState, useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BiMenu, BiX } from "react-icons/bi";
import { authContext } from "../../context/AuthContext.jsx";
import userImg from "../../assets/images/defaultUser.jpg";

const Header = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, role, token, dispatch } = useContext(authContext);

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/login");
  };

  const normalizedRole = (role || "").toUpperCase();

  const getDashboardPath = () => {
    if (normalizedRole === "DOCTOR") return "/doctor/dashboard";
    return "/my-appointments";
  };

  return (
    <header className="header flex items-center bg-white shadow-sm h-20 sticky top-0 z-50">
      <div className="container max-w-[1280px] mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <svg
              className="w-8 h-8 text-primaryColor"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3"
              ></path>
            </svg>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-primaryColor tracking-tight leading-tight">
                Health<span className="text-headingColor">Bridge</span>
              </span>
              <span className="text-[10px] text-textColor font-medium tracking-wide uppercase leading-none">
                Appointment & Care Portal
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className={`md:flex items-center gap-8 ${menuOpen ? "block absolute top-20 left-0 w-full bg-white p-4 shadow-md md:static md:w-auto md:p-0 md:shadow-none" : "hidden"}`}>
            <NavLink
              to="/doctors"
              className={({ isActive }) =>
                isActive ? "text-primaryColor font-bold text-sm" : "text-textColor hover:text-primaryColor font-medium text-sm"
              }
              onClick={() => setMenuOpen(false)}
            >
              Find Doctors
            </NavLink>

            {token && normalizedRole === "PATIENT" && (
              <NavLink
                to="/my-appointments"
                className={({ isActive }) =>
                  isActive ? "text-primaryColor font-bold text-sm" : "text-textColor hover:text-primaryColor font-medium text-sm"
                }
                onClick={() => setMenuOpen(false)}
              >
                My Appointments
              </NavLink>
            )}

            {token && normalizedRole === "DOCTOR" && (
              <NavLink
                to="/doctor/dashboard"
                className={({ isActive }) =>
                  isActive ? "text-primaryColor font-bold text-sm" : "text-textColor hover:text-primaryColor font-medium text-sm"
                }
                onClick={() => setMenuOpen(false)}
              >
                Doctor Dashboard
              </NavLink>
            )}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-4">
            {token ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <img
                    src={user?.photoUrl || userImg}
                    alt={user?.name || "User Profile"}
                    className="w-10 h-10 rounded-full object-cover border-2 border-primaryColor"
                  />
                  <span className="hidden sm:inline font-bold text-xs text-headingColor">{user?.name || "Account"}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-150 rounded-xl p-3 shadow-xl space-y-2 z-50">
                    <div className="border-b pb-2">
                      <p className="font-bold text-xs text-headingColor truncate">{user?.name}</p>
                      <p className="text-[11px] text-textColor truncate">{user?.email}</p>
                    </div>

                    <Link
                      to={getDashboardPath()}
                      onClick={() => setDropdownOpen(false)}
                      className="block text-xs font-semibold text-textColor hover:text-primaryColor py-1"
                    >
                      Dashboard
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left text-xs font-bold text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <button className="border border-primaryColor text-primaryColor hover:bg-primaryColor/5 font-bold text-xs px-4 py-2 rounded-full transition">
                    Login
                  </button>
                </Link>
                <Link to="/signup">
                  <button className="bg-primaryColor hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-full shadow-sm transition">
                    Register
                  </button>
                </Link>
              </div>
            )}

            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <BiX className="w-7 h-7" /> : <BiMenu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
