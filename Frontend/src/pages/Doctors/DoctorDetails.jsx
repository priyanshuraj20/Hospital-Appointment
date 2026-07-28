import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BASE_URL } from "../../config";
import Loader from "../../components/Loader/Loading.jsx";
import ErrorComponent from "../../components/Error/Error.jsx";
import DoctorAvatar from "../../components/DoctorAvatar.jsx";
import { authContext } from "../../context/AuthContext.jsx";
import { toast } from "react-toastify";
import { BiCheckCircle } from "react-icons/bi";

const DEFAULT_SLOTS = [
  { id: "default-1", dayOfWeek: "General", startTime: "09:00", endTime: "10:00" },
  { id: "default-2", dayOfWeek: "General", startTime: "10:30", endTime: "11:30" },
  { id: "default-3", dayOfWeek: "General", startTime: "14:00", endTime: "15:00" },
  { id: "default-4", dayOfWeek: "General", startTime: "16:00", endTime: "17:00" },
];

const DoctorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, dispatch } = useContext(authContext);

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking Form State
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [symptoms, setSymptoms] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/doctors/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to load doctor profile");
        
        const docData = json.data;
        setDoctor(docData);

        const availableSlots = docData?.slots && docData.slots.length > 0 ? docData.slots : DEFAULT_SLOTS;
        if (availableSlots.length > 0) {
          setSelectedSlot(availableSlots[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const activeSlots = doctor?.slots && doctor.slots.length > 0 ? doctor.slots : DEFAULT_SLOTS;

  const handleBookingAndPayment = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.info("Please log in as a patient to book an appointment.");
      navigate("/login");
      return;
    }

    if (!appointmentDate) {
      toast.error("Please select an appointment date.");
      return;
    }

    if (!selectedSlot) {
      toast.error("Please select a time slot.");
      return;
    }

    setBookingLoading(true);

    try {
      // 1. Create Appointment
      const bookRes = await fetch(`${BASE_URL}/appointments/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId: doctor.id,
          slotId: selectedSlot.id.startsWith("default") ? null : selectedSlot.id,
          appointmentDate,
          timeSlot: `${selectedSlot.startTime} - ${selectedSlot.endTime}`,
          symptoms,
        }),
      });

      const bookData = await bookRes.json();

      if (bookRes.status === 401) {
        dispatch({ type: "LOGOUT" });
        toast.error("Session expired or invalid token. Please log in again.");
        navigate("/login");
        return;
      }

      if (!bookRes.ok) throw new Error(bookData.message || "Booking failed.");

      const appointmentId = bookData.data.id;

      // 2. Initiate Razorpay Order
      const orderRes = await fetch(`${BASE_URL}/payments/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appointmentId }),
      });

      const orderData = await orderRes.json();

      if (orderRes.status === 401) {
        dispatch({ type: "LOGOUT" });
        toast.error("Session expired or invalid token. Please log in again.");
        navigate("/login");
        return;
      }

      if (!orderRes.ok) throw new Error(orderData.message || "Failed to create payment order.");

      const { orderId, keyId, amount, currency } = orderData.data;

      // 3. Load Razorpay SDK and open Checkout
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.warn("Razorpay SDK failed to load online. Proceeding with mock payment verification.");
      }

      const options = {
        key: keyId,
        amount,
        currency,
        name: "HealthBridge Care",
        description: `Consultation with ${doctor.user?.name}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${BASE_URL}/payments/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                appointmentId,
                razorpayOrderId: response.razorpay_order_id || orderId,
                razorpayPaymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
                razorpaySignature: response.razorpay_signature || "mock_sig",
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              toast.success("Appointment Confirmed Successfully");
              navigate("/my-appointments");
            } else {
              toast.error(verifyData.message || "Payment verification failed.");
            }
          } catch (err) {
            toast.error("Verification error occurred.");
          }
        },
        prefill: {
          name: "Patient",
        },
        theme: {
          color: "#008080",
        },
      };

      if (window.Razorpay) {
        const razorpayObj = new window.Razorpay(options);
        razorpayObj.open();
      } else {
        const verifyRes = await fetch(`${BASE_URL}/payments/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            appointmentId,
            razorpayOrderId: orderId,
            razorpayPaymentId: `pay_mock_${Date.now()}`,
            razorpaySignature: "mock_sig",
          }),
        });

        if (verifyRes.ok) {
          toast.success("Appointment Confirmed Successfully");
          navigate("/my-appointments");
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to process booking.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <ErrorComponent errMsg={error} />;
  if (!doctor) return null;

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container max-w-[1000px] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Doctor Profile Info */}
          <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-start gap-5 border-b pb-6">
              <DoctorAvatar
                name={doctor.user?.name}
                photoUrl={doctor.photoUrl}
                className="w-24 h-24 text-xl"
              />
              <div>
                <h2 className="text-xl font-bold text-headingColor">{doctor.user?.name}</h2>
                <span className="inline-block bg-teal-50 text-primaryColor text-xs font-bold px-3 py-1 rounded-full mt-1">
                  {doctor.specialization}
                </span>
                <p className="text-xs text-textColor mt-2 font-medium">
                  {doctor.qualification} • {doctor.experienceYears} Years Experience
                </p>
                <p className="text-xs text-textColor mt-1">{doctor.user?.email}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-headingColor text-sm mb-2">About Doctor</h4>
              <p className="text-xs text-textColor leading-relaxed">
                {doctor.bio || "Dedicated healthcare professional providing high quality medical care and patient consultations."}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-headingColor text-sm mb-3">Available Slots</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeSlots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-xl border text-left text-xs transition relative flex flex-col justify-between ${
                        isSelected
                          ? "border-primaryColor bg-teal-50 text-primaryColor font-bold shadow-sm ring-1 ring-primaryColor"
                          : "border-gray-200 bg-gray-50 text-textColor hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="block font-bold text-headingColor">{slot.dayOfWeek}</span>
                        {isSelected && <BiCheckCircle className="text-primaryColor w-4 h-4" />}
                      </div>
                      <span className="block text-[11px] mt-1">{slot.startTime} - {slot.endTime}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-fit space-y-5">
            <div className="border-b pb-4 flex justify-between items-center">
              <span className="text-xs font-bold text-textColor">Consultation Fee</span>
              <span className="text-xl font-bold text-primaryColor">₹{doctor.consultationFee}</span>
            </div>

            <form onSubmit={handleBookingAndPayment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-headingColor block mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:border-primaryColor"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-headingColor block mb-1">
                  Select Time Slot
                </label>
                <select
                  value={selectedSlot ? selectedSlot.id : ""}
                  onChange={(e) => {
                    const found = activeSlots.find((s) => s.id === e.target.value);
                    if (found) setSelectedSlot(found);
                  }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs bg-white text-headingColor font-semibold focus:outline-none focus:border-primaryColor"
                >
                  {activeSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.dayOfWeek}: {s.startTime} - {s.endTime}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSlot && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primaryColor block mb-0.5">
                    Selected Appointment Slot
                  </span>
                  <span className="font-bold text-headingColor">
                    {appointmentDate} ({selectedSlot.startTime} - {selectedSlot.endTime})
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-headingColor block mb-1">
                  Symptoms / Reason for Visit
                </label>
                <textarea
                  rows="3"
                  placeholder="Describe symptoms briefly..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:border-primaryColor"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full bg-primaryColor hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm"
              >
                {bookingLoading ? "Processing..." : "Book & Pay via Razorpay"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetails;
