import { BASE_URL } from "../../config";
import useFetchData from "../../hooks/useFetchData";
import DoctorCard from "../../components/Doctors/DoctorCard";
import Testimonials from "../../components/Testimonials/Testimonials";
import Error from "../../components/Error/Error";
import Loader from "../../components/Loader/Loading";
import { useEffect, useState } from "react";
import SymptomChecker from "../../components/AI/SymptomChecker";

const Doctors = () => {
  const [query, setQuery] = useState("");
  const [debounceQuery, setDebounceQuery] = useState("");
  const [aiResult, setAiResult] = useState(null);

  // AUTO FILTER FROM AI
  useEffect(() => {
    if (aiResult?.specialization) {
      setQuery(aiResult.specialization);
      setDebounceQuery(aiResult.specialization);
    }
  }, [aiResult]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounceQuery(query.trim());
    }, 700);
    return () => clearTimeout(t);
  }, [query]);

  const {
    data: doctors = [],
    loading,
    error,
  } = useFetchData(`${BASE_URL}/doctors?query=${debounceQuery}`);

  return (
    <>
      <section className="bg-[#fff9ea]">
        <div className="container text-center">
          <h2 className="heading">Find a Doctor</h2>

          <input
            type="search"
            className="mt-6 p-4 w-full max-w-[500px]"
            placeholder="Search doctor"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </section>

      {/* AI */}
      <section className="pt-8">
        <div className="container max-w-[800px]">
          <SymptomChecker onResult={setAiResult} />

          {aiResult && (
            <div className="mt-6 p-6 border rounded-lg bg-green-50">
              <p>
                <b>Specialist:</b>{" "}
                <span className="text-blue-600">{aiResult.specialization}</span>
              </p>
              <p>
                <b>Urgency:</b> {aiResult.urgency}
              </p>
              <p className="text-sm mt-2">{aiResult.advice}</p>

              {aiResult.urgency === "High" && (
                <div className="mt-4 text-red-600 font-semibold">
                  ⚠️ Consult immediately
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* DOCTORS */}
      <section className="pt-10">
        <div className="container">
          {loading && <Loader />}
          {error && <Error />}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {doctors.length ? (
                doctors.map((doc) => <DoctorCard key={doc._id} doctor={doc} />)
              ) : (
                <p>No doctors found</p>
              )}
            </div>
          )}
        </div>
        <Testimonials />
      </section>
    </>
  );
};

export default Doctors;
