import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { BASE_URL } from "../../config";
import { authContext } from "../../context/AuthContext.jsx";
import Loader from "../../components/Loader/Loading.jsx";
import ErrorComponent from "../../components/Error/Error.jsx";
import { toast } from "react-toastify";

const MyAppointments = () => {
  const { token } = useContext(authContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/appointments/my-appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to fetch appointments.");
      setAppointments(json.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAppointments();
  }, [token]);

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      const res = await fetch(`${BASE_URL}/appointments/cancel/${appointmentId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Cancellation failed.");
      toast.success(json.message);
      fetchAppointments();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePayNow = async (appointment) => {
    try {
      const orderRes = await fetch(`${BASE_URL}/payments/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appointmentId: appointment.id }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message);

      const { orderId, keyId, amount, currency } = orderData.data;

      const verifyRes = await fetch(`${BASE_URL}/payments/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentId: appointment.id,
          razorpayOrderId: orderId,
          razorpayPaymentId: `pay_manual_${Date.now()}`,
          razorpaySignature: "mock_sig",
        }),
      });

      if (verifyRes.ok) {
        toast.success("Appointment Confirmed Successfully");
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loader />;
  if (error) return <ErrorComponent errMsg={error} />;

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container max-w-[1100px] mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-headingColor">My Appointments</h2>
            <p className="text-xs text-textColor">View appointment history, payment status, and doctor follow-up notes</p>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm max-w-md mx-auto my-8">
            <div className="w-12 h-12 bg-teal-50 text-primaryColor rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              📅
            </div>
            <h3 className="font-bold text-headingColor text-base">No appointments yet.</h3>
            <p className="text-xs text-textColor mt-1 mb-5">Book your first consultation.</p>
            <Link
              to="/doctors"
              className="inline-block bg-primaryColor hover:bg-teal-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition"
            >
              Find Doctors
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-xs font-bold text-headingColor uppercase tracking-wider">
                    <th className="p-4">Doctor</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Fee</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs text-textColor">
                  {appointments.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="p-4">
                        <p className="font-bold text-headingColor">{item.doctor?.user?.name}</p>
                        <span className="text-[11px] text-primaryColor font-medium">{item.doctor?.specialization}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-headingColor">
                          {new Date(item.appointmentDate).toLocaleDateString()}
                        </p>
                        <span className="text-[11px] text-gray-500">{item.timeSlot}</span>
                      </td>
                      <td className="p-4 font-bold text-headingColor">₹{item.amount}</td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.paymentStatus === "PAID"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === "CONFIRMED"
                              ? "bg-blue-100 text-blue-800"
                              : item.status === "COMPLETED"
                              ? "bg-teal-100 text-teal-800"
                              : item.status === "CANCELLED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {item.paymentStatus === "PENDING" && item.status !== "CANCELLED" && (
                          <button
                            onClick={() => handlePayNow(item)}
                            className="bg-primaryColor hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition"
                          >
                            Pay Now
                          </button>
                        )}

                        {item.followUp && (
                          <button
                            onClick={() => setSelectedFollowUp(item.followUp)}
                            className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold px-3 py-1.5 rounded-lg text-[11px] transition"
                          >
                            Follow-up Note
                          </button>
                        )}

                        {item.status !== "COMPLETED" && item.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleCancelAppointment(item.id)}
                            className="bg-red-50 text-red-600 hover:bg-red-100 font-bold px-3 py-1.5 rounded-lg text-[11px] transition"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Follow-up Note Modal */}
        {selectedFollowUp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-headingColor text-base">Doctor Follow-Up & Prescription</h3>
                <button
                  onClick={() => setSelectedFollowUp(null)}
                  className="text-gray-400 hover:text-headingColor font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Clinical Notes
                </span>
                <p className="text-xs text-headingColor bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-wrap">
                  {selectedFollowUp.notes}
                </p>
              </div>

              {selectedFollowUp.prescription && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    Prescribed Medicines
                  </span>
                  <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-100 text-xs space-y-1">
                    {Array.isArray(selectedFollowUp.prescription) ? (
                      selectedFollowUp.prescription.map((med, idx) => (
                        <div key={idx} className="flex justify-between font-medium text-headingColor">
                          <span>• {med.medicineName || med.name}</span>
                          <span className="text-textColor">{med.dosage} ({med.duration})</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-headingColor">{JSON.stringify(selectedFollowUp.prescription)}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedFollowUp.followUpDate && (
                <div className="text-xs font-semibold text-primaryColor">
                  Recommended Next Review: {new Date(selectedFollowUp.followUpDate).toLocaleDateString()}
                </div>
              )}

              <button
                onClick={() => setSelectedFollowUp(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-headingColor font-bold py-2 rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;
