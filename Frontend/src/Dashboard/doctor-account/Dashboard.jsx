import { useEffect, useState, useContext } from "react";
import { BASE_URL } from "../../config";
import { authContext } from "../../context/AuthContext.jsx";
import Loader from "../../components/Loader/Loading.jsx";
import ErrorComponent from "../../components/Error/Error.jsx";
import { toast } from "react-toastify";
import { BiTrash, BiPlusCircle, BiCalendar } from "react-icons/bi";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DoctorDashboard = () => {
  const { token, user } = useContext(authContext);
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Tab: 'appointments' or 'slots'
  const [activeTab, setActiveTab] = useState("appointments");

  // New Slot Form State
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [slotAdding, setSlotAdding] = useState(false);

  // Follow-up Modal State
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [medicines, setMedicines] = useState([{ medicineName: "", dosage: "", duration: "" }]);
  const [submitting, setSubmitting] = useState(false);

  const fetchDoctorData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Appointments
      const apptRes = await fetch(`${BASE_URL}/appointments/doctor-appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const apptJson = await apptRes.json();
      if (!apptRes.ok) throw new Error(apptJson.message || "Failed to fetch appointments.");
      setAppointments(apptJson.data || []);

      // 2. Fetch Profile & Slots
      const meRes = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meJson = await meRes.json();
      if (meRes.ok && meJson.data?.doctorProfile?.slots) {
        setSlots(meJson.data.doctorProfile.slots || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDoctorData();
  }, [token]);

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      const res = await fetch(`${BASE_URL}/appointments/status/${appointmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      toast.success(`Status updated to ${newStatus}`);
      fetchDoctorData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      toast.error("Please enter start and end time.");
      return;
    }

    setSlotAdding(true);
    try {
      const res = await fetch(`${BASE_URL}/doctors/slots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dayOfWeek, startTime, endTime }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to add slot.");

      toast.success("Consultation slot added!");
      fetchDoctorData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSlotAdding(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm("Are you sure you want to remove this slot?")) return;

    try {
      const res = await fetch(`${BASE_URL}/doctors/slots/${slotId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to delete slot.");

      toast.success("Slot removed.");
      fetchDoctorData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddMedicineRow = () => {
    setMedicines([...medicines, { medicineName: "", dosage: "", duration: "" }]);
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast.error("Please enter clinical notes.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/followups/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentId: activeAppointment.id,
          notes,
          prescription: medicines.filter((m) => m.medicineName.trim() !== ""),
          followUpDate: followUpDate || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      toast.success("Follow-up note and prescription saved!");
      setActiveAppointment(null);
      setNotes("");
      setFollowUpDate("");
      setMedicines([{ medicineName: "", dosage: "", duration: "" }]);
      fetchDoctorData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <ErrorComponent errMsg={error} />;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container max-w-[1150px] mx-auto px-4">
        {/* Header Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-headingColor">Doctor Workspace</h2>
            <p className="text-xs text-textColor">Manage patient consultations and availability slots</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("appointments")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "appointments"
                  ? "bg-primaryColor text-white shadow-sm"
                  : "bg-white border border-gray-200 text-textColor hover:bg-gray-100"
              }`}
            >
              Consultation Queue ({appointments.length})
            </button>
            <button
              onClick={() => setActiveTab("slots")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "slots"
                  ? "bg-primaryColor text-white shadow-sm"
                  : "bg-white border border-gray-200 text-textColor hover:bg-gray-100"
              }`}
            >
              Manage Time Slots ({slots.length})
            </button>
          </div>
        </div>

        {/* TAB 1: Appointments Queue */}
        {activeTab === "appointments" && (
          <>
            {appointments.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
                <p className="font-bold text-headingColor text-sm">No patient appointments scheduled.</p>
                <p className="text-xs text-textColor mt-1">Booked appointments will appear in this queue.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200 text-xs font-bold text-headingColor uppercase tracking-wider">
                        <th className="p-4">Patient</th>
                        <th className="p-4">Date & Slot</th>
                        <th className="p-4">Symptoms</th>
                        <th className="p-4">Payment</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-xs text-textColor">
                      {appointments.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="p-4">
                            <p className="font-bold text-headingColor">{item.patient?.name}</p>
                            <span className="text-[11px] text-textColor">{item.patient?.email} • {item.patient?.phone || "No phone"}</span>
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-headingColor">
                              {new Date(item.appointmentDate).toLocaleDateString()}
                            </p>
                            <span className="text-[11px] text-gray-500">{item.timeSlot}</span>
                          </td>
                          <td className="p-4 max-w-[200px] truncate">
                            {item.symptoms || "Regular Checkup"}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                item.paymentStatus === "PAID" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {item.paymentStatus}
                            </span>
                          </td>
                          <td className="p-4">
                            <select
                              value={item.status}
                              onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                              className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-headingColor focus:outline-none"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="CONFIRMED">CONFIRMED</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setActiveAppointment(item)}
                              className="bg-primaryColor hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition"
                            >
                              + Follow-Up Note
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: Doctor Slot Management */}
        {activeTab === "slots" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Create Slot Form */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-fit">
              <h3 className="font-bold text-headingColor text-sm mb-1 flex items-center gap-1.5">
                <BiPlusCircle className="text-primaryColor w-4 h-4" /> Add Availability Slot
              </h3>
              <p className="text-[11px] text-textColor mb-4">Set your weekly consultation hours</p>

              <form onSubmit={handleAddSlot} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-headingColor block mb-1">Day of Week</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:border-primaryColor font-semibold"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-headingColor block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:border-primaryColor"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-headingColor block mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:border-primaryColor"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={slotAdding}
                  className="w-full bg-primaryColor hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
                >
                  {slotAdding ? "Adding..." : "Add Time Slot"}
                </button>
              </form>
            </div>

            {/* Configured Slots Grid */}
            <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-headingColor text-sm mb-1 flex items-center gap-1.5">
                <BiCalendar className="text-primaryColor w-4 h-4" /> Active Weekly Slots
              </h3>
              <p className="text-[11px] text-textColor mb-4">Time slots available for patient online booking</p>

              {slots.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl p-6">
                  <p className="text-xs font-bold text-headingColor">No recurring slots configured.</p>
                  <p className="text-[11px] text-textColor mt-0.5">Use the form to add available hours.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-bold text-headingColor block">{slot.dayOfWeek}</span>
                        <span className="text-[11px] text-primaryColor font-semibold mt-0.5 block">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                        title="Delete slot"
                      >
                        <BiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Follow-Up Modal */}
        {activeAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="font-bold text-headingColor text-base">Create Follow-Up Note</h3>
                  <p className="text-xs text-textColor">Patient: {activeAppointment.patient?.name}</p>
                </div>
                <button
                  onClick={() => setActiveAppointment(null)}
                  className="text-gray-400 hover:text-headingColor font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFollowUpSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-headingColor block mb-1">
                    Clinical Diagnosis & Notes
                  </label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Enter observation notes, instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:border-primaryColor"
                  ></textarea>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-headingColor">Prescribed Medicines</label>
                    <button
                      type="button"
                      onClick={handleAddMedicineRow}
                      className="text-[11px] font-bold text-primaryColor hover:underline"
                    >
                      + Add Medicine
                    </button>
                  </div>

                  <div className="space-y-2">
                    {medicines.map((med, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Medicine name"
                          value={med.medicineName}
                          onChange={(e) => handleMedicineChange(idx, "medicineName", e.target.value)}
                          className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50"
                        />
                        <input
                          type="text"
                          placeholder="Dosage (e.g. 1-0-1)"
                          value={med.dosage}
                          onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                          className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50"
                        />
                        <input
                          type="text"
                          placeholder="Duration (5 days)"
                          value={med.duration}
                          onChange={(e) => handleMedicineChange(idx, "duration", e.target.value)}
                          className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-headingColor block mb-1">
                    Next Follow-up Review Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:border-primaryColor"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveAppointment(null)}
                    className="w-1/2 bg-gray-100 text-headingColor font-bold py-2 rounded-xl text-xs hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-1/2 bg-primaryColor text-white font-bold py-2 rounded-xl text-xs hover:bg-teal-700 transition"
                  >
                    {submitting ? "Saving..." : "Save Follow-up"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
