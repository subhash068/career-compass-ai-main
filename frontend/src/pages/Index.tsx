import { Navigate } from 'react-router-dom';

// Redirect to Dashboard as the main entry point
const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
