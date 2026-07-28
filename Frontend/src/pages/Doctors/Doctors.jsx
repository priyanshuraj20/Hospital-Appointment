import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../config";
import Loader from "../../components/Loader/Loading.jsx";
import ErrorComponent from "../../components/Error/Error.jsx";
import DoctorAvatar from "../../components/DoctorAvatar.jsx";
import { BiSearch, BiX } from "react-icons/bi";

const SPECIALIZATIONS = [
  "All",
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Neurology",
  "Orthopedics",
  "General Physician",
];

const Doctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("All");

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${BASE_URL}/doctors`;
      const params = new URLSearchParams();

      if (selectedSpecialization && selectedSpecialization !== "All") {
        params.append("specialization", selectedSpecialization);
      }
      if (searchQuery.trim()) {
        params.append("query", searchQuery.trim());
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to fetch doctors");
      }

      setDoctors(json.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialization]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    fetchDoctors();
  };

  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="container max-w-[1200px] mx-auto px-4">
        {/* Search & Filter Compact Header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-headingColor">Doctor Directory</h2>
              <p className="text-xs text-textColor mt-0.5">Find specialists and schedule appointments</p>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <BiSearch className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search doctor by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primaryColor focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-headingColor"
                  >
                    <BiX className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="bg-primaryColor hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Search
              </button>
            </form>
          </div>

          {/* Specialization Filter Pills */}
          <div className="flex flex-wrap gap-2 border-t pt-3 border-gray-100">
            {SPECIALIZATIONS.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialization(spec)}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition ${
                  selectedSpecialization === spec
                    ? "bg-primaryColor text-white shadow-sm"
                    : "bg-gray-100 text-textColor hover:bg-gray-200"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Doctor Grid */}
        {loading && <Loader />}
        {error && <ErrorComponent errMsg={error} />}

        {!loading && !error && (
          <>
            {doctors.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-200 p-8 max-w-md mx-auto shadow-sm">
                <p className="font-bold text-headingColor text-sm">No doctors found matching your search.</p>
                <p className="text-xs text-textColor mt-1 mb-3">
                  Try clearing your search query or choosing another specialization.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSpecialization("All");
                  }}
                  className="bg-primaryColor hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {doctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between h-full"
                  >
                    <div>
                      {/* Avatar & Main Info */}
                      <div className="flex items-center gap-3.5 mb-3">
                        <DoctorAvatar
                          name={doc.user?.name}
                          photoUrl={doc.photoUrl}
                          className="w-14 h-14"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-headingColor text-sm truncate">{doc.user?.name}</h3>
                          <span className="inline-block bg-teal-50 text-primaryColor text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5">
                            {doc.specialization}
                          </span>
                          <p className="text-[11px] text-textColor mt-0.5 truncate">{doc.qualification}</p>
                        </div>
                      </div>

                      {/* Description Clamped to 2 lines */}
                      <div className="min-h-[2.5rem] mb-3">
                        <p className="text-xs text-textColor line-clamp-2">
                          {doc.bio || "Experienced specialist committed to patient wellness and diagnostic care."}
                        </p>
                      </div>

                      {/* Experience and Fee Aligned on One Row */}
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs mb-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Exp:</span>
                          <span className="font-bold text-headingColor">{doc.experienceYears} Years</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Fee:</span>
                          <span className="font-bold text-primaryColor">₹{doc.consultationFee}</span>
                        </div>
                      </div>
                    </div>

                    {/* Book Appointment Button Fixed at Card Bottom */}
                    <button
                      onClick={() => navigate(`/doctors/${doc.id}`)}
                      className="w-full bg-primaryColor hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs transition mt-auto"
                    >
                      Book Appointment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Doctors;
