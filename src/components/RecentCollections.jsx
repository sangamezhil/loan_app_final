import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { List } from 'lucide-react';

export function RecentCollections() {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    loadRecentCollections();
    
    const handleStorageChange = () => {
      loadRecentCollections();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadRecentCollections = () => {
    const storedCollections = JSON.parse(localStorage.getItem('loan_collections') || '[]')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
    
        const customers = JSON.parse(localStorage.getItem('loan_customers') || '[]');
    
    const collectionsWithDetails = storedCollections.map(collection => {
      const customer = customers.find(c => c.id === collection.customerId);
      return {
        ...collection,
        customerName: customer?.name || 'N/A',
      };
    });
    setCollections(collectionsWithDetails);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <List className="h-5 w-5 mr-2" />
          Recent Collection Records
        </CardTitle>
      </CardHeader>
      <CardContent>
        {collections.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {collections.map(collection => (
              <div key={collection.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-medium">{collection.customerName}</p>
                  <p className="text-sm text-gray-500">Loan ID: {collection.loanId}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">₹{collection.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{new Date(collection.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No recent collections found.</p>
        )}
      </CardContent>
    </Card>
  );
}