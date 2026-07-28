import { useState } from "react";

const DEFAULT_DOCTOR_IMAGE = "/images/doctors/default_doctor.png";

const DoctorAvatar = ({ name = "Doctor", photoUrl, className = "w-16 h-16" }) => {
  const [imgError, setImgError] = useState(false);

  const initialSrc = photoUrl || DEFAULT_DOCTOR_IMAGE;
  const finalSrc = imgError ? DEFAULT_DOCTOR_IMAGE : initialSrc;

  return (
    <img
      src={finalSrc}
      alt={name}
      onError={() => setImgError(true)}
      className={`${className} rounded-full object-cover border-2 border-primaryColor flex-shrink-0`}
    />
  );
};

export default DoctorAvatar;
