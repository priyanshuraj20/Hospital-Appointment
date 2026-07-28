import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-16">
      <div className="container max-w-[1280px] mx-auto px-4 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="text-lg font-bold text-primaryColor">
            Health<span className="text-headingColor">Bridge</span>
          </span>
          <p className="text-xs text-textColor mt-1">
            Secure Healthcare Access & Appointment Platform
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs font-medium text-textColor">
          <Link to="/doctors" className="hover:text-primaryColor">
            Find Doctors
          </Link>
          <Link to="/login" className="hover:text-primaryColor">
            Patient Login
          </Link>
          <Link to="/signup" className="hover:text-primaryColor">
            Doctor Join
          </Link>
        </div>

        <p className="text-xs text-gray-400">
          &copy; {currentYear} HealthBridge. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
