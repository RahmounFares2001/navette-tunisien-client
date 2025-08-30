import { Navigate } from 'react-router-dom';

const Index = () => {
  // Redirect to Home component since that's our main page
  return <Navigate to="/" replace />;
};

export default Index;
