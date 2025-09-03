import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const ProtectedAdminRoute = ({ children }) => {
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_BASE}/api/verifyAdmin`, {
      withCredentials: true,
    })
    .then(res => {
      if (res.data.success) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }
    })
    .catch(() => {
      setAuthorized(false);
    });
  }, []);

  if (authorized === null) return <p>Loading...</p>;

  return authorized ? children : <Navigate to="/login" />;
};

export default ProtectedAdminRoute;
