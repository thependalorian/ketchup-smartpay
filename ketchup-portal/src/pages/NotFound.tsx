import { Layout } from '../components/layout/Layout';
import { Card, Button } from '@smartpay/ui';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <Layout title="404" subtitle="Page not found">
      <Card>
        <div className="p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">404</h2>
          <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </Card>
    </Layout>
  );
};

export default NotFound;
