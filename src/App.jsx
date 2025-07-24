import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth.jsx';
import { Layout } from '@/components/Layout';
import { Login } from '@/components/Login';
import { Dashboard } from '@/components/Dashboard';
import { NewCustomer } from '@/components/NewCustomer';
import { CustomerList } from '@/components/CustomerList';
import { NewLoan } from '@/components/NewLoan';
import { Collections } from '@/components/Collections';
import { Settings } from '@/components/Settings';
import { Toaster } from '@/components/ui/toaster';

function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login />
        <Toaster />
      </>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'customers':
        return <CustomerList />;
      case 'new-customer':
        return <NewCustomer />;
      case 'new-loan':
        return <NewLoan />;
      case 'collections':
        return <Collections />;
      case 'settings':
        return user.role === 'admin' ? <Settings /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
      <Toaster />
    </>
  );
}

export default App;