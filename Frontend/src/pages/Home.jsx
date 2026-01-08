import heroImg01 from "../assets/images/hero-img01.png";
import heroImg02 from "../assets/images/hero-img02.png";
import heroImg03 from "../assets/images/hero-img03.png";
import featureImg from "../assets/images/feature-img.png";
import avatarIcon from "../assets/images/avatar-icon.png";
import icon01 from "../assets/images/icon01.png";
import icon02 from "../assets/images/icon02.png";
import icon03 from "../assets/images/icon03.png";
import faqImg from "../assets/images/faq-img.png";
import videoIcon from "../assets/images/video-icon.png";
import { BsArrowRightShort } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";

import About from "../components/About/About";
import ServiceList from "../components/Services/ServiceList";
import DoctorList from "../components/Doctors/DoctorList";
import FaqList from "../components/Faq/FaqList";
import Testimonials from "../components/Testimonials/Testimonials";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* ================= HERO ================= */}
      <section className="relative bg-[#f9fbfc] pt-[70px] pb-[90px]">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-[80px] items-center">
            {/* LEFT */}
            <div>
              <span className="inline-block bg-irisBlueColor/10 text-irisBlueColor px-4 py-2 rounded-full text-sm font-[600] mb-4">
                Trusted Medical Platform
              </span>

              <h1 className="text-[38px] md:text-[58px] leading-[48px] md:leading-[68px] font-[800] text-headingColor">
                Book Doctor Appointments <br />
                <span className="text-irisBlueColor">Without Hassle</span>
              </h1>

              <p className="text_para mt-6 max-w-[520px]">
                Connect with verified doctors, schedule appointments instantly,
                and get expert medical care — online or in-clinic.
              </p>

              <div className="flex gap-4 mt-8">
                <button onClick={() => navigate("/doctors")} className="btn">
                  Find Doctors
                </button>

                <Link
                  to="/contact"
                  className="flex items-center gap-1 text-headingColor font-[600]"
                >
                  Learn more <BsArrowRightShort className="text-xl" />
                </Link>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-3 gap-6 mt-12 max-w-[520px]">
                <div className="bg-white shadow-sm rounded-xl p-4">
                  <h2 className="text-[28px] font-[700] text-headingColor">
                    30+
                  </h2>
                  <p className="text-sm text-textColor">Years Experience</p>
                </div>
                <div className="bg-white shadow-sm rounded-xl p-4">
                  <h2 className="text-[28px] font-[700] text-headingColor">
                    15+
                  </h2>
                  <p className="text-sm text-textColor">Clinic Locations</p>
                </div>
                <div className="bg-white shadow-sm rounded-xl p-4">
                  <h2 className="text-[28px] font-[700] text-headingColor">
                    100%
                  </h2>
                  <p className="text-sm text-textColor">Satisfaction</p>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex gap-6 justify-center">
              <img src={heroImg01} alt="" />
              <div className="flex flex-col gap-6 mt-8">
                <img src={heroImg02} alt="" />
                <img src={heroImg03} alt="" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= AI SYMPTOM CHECKER CTA ================= */}
      <section className="py-[70px] bg-white">
        <div className="container">
          <div className="max-w-[900px] mx-auto bg-[#f9fbfc] border rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-[28px] font-[700] text-headingColor">
                Not sure which doctor to consult?
              </h2>
              <p className="text_para mt-2 max-w-[520px]">
                Describe your symptoms and our smart assistant will guide you to
                the right medical specialist — instantly.
              </p>
            </div>

            <button
              onClick={() => navigate("/doctors#ai-checker")}
              className="btn whitespace-nowrap"
            >
              Check Symptoms
            </button>
          </div>
        </div>
      </section>

      {/* ================= QUICK ACTIONS ================= */}
      <section className="py-[90px]">
        <div className="container">
          <div className="text-center max-w-[520px] mx-auto mb-14">
            <h2 className="heading">Healthcare Made Simple</h2>
            <p className="text_para mt-2">
              Everything you need — from finding doctors to booking
              appointments.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                icon: icon01,
                title: "Search Doctors",
                desc: "Browse verified specialists across departments.",
                link: "/doctors",
              },
              {
                icon: icon02,
                title: "Find Clinics",
                desc: "Locate hospitals and clinics near you.",
                link: "/contact",
              },
              {
                icon: icon03,
                title: "Book Appointment",
                desc: "Schedule appointments in just a few clicks.",
                link: "/doctors",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white shadow-md rounded-2xl p-8 text-center hover:shadow-lg transition"
              >
                <img src={item.icon} className="mx-auto mb-6" alt="" />
                <h3 className="text-[22px] font-[700] text-headingColor">
                  {item.title}
                </h3>
                <p className="text_para mt-3">{item.desc}</p>
                <Link
                  to={item.link}
                  className="inline-flex items-center gap-1 mt-4 font-[600] text-irisBlueColor"
                >
                  Explore <BsArrowRightShort />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= REST UNCHANGED ================= */}
      <About />

      <section>
        <div className="container">
          <div className="text-center max-w-[520px] mx-auto">
            <h2 className="heading">Our Medical Services</h2>
            <p className="text_para mt-2">
              Comprehensive care designed for every patient.
            </p>
          </div>
          <ServiceList />
        </div>
      </section>

      <section className="lg:pt-[60px]">
        <div className="container">
          <h2 className="heading text-center">Our Doctors</h2>
          <DoctorList />
        </div>
      </section>

      <section className="lg:pt-[60px]">
        <div className="container flex gap-[50px]">
          <img src={faqImg} className="w-[35%] hidden md:block" alt="" />
          <div className="w-full md:w-1/2">
            <h2 className="heading">Frequently Asked Questions</h2>
            <FaqList />
          </div>
        </div>
      </section>

      <section className="pb-0">
        <div className="container text-center">
          <h2 className="heading">What Patients Say</h2>
          <p className="text_para mt-2">
            Real feedback from people who trusted us.
          </p>
        </div>
        <Testimonials />
      </section>
    </div>
  );
};

export default Home;
