import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus } from 'lucide-react';

export function NewCustomer() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    idType: '',
    idNumber: '',
    occupation: '',
    monthlyIncome: ''
  });

  const idTypes = [
    'Aadhar Card',
    'Pan Card',
    'Ration Card',
    'Voter ID',
    'Bank Pass Book',
    'Gas Book'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.idType || !formData.idNumber || !formData.occupation || !formData.monthlyIncome) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Check if customer with same ID already exists
    const customers = JSON.parse(localStorage.getItem('loan_customers') || '[]');
    const existingCustomer = customers.find(c => c.idType === formData.idType && c.idNumber === formData.idNumber);
    
    if (existingCustomer) {
      toast({
        title: "Error",
        description: "A customer with this ID already exists",
        variant: "destructive"
      });
      return;
    }

    const newCustomer = {
      id: Date.now().toString(),
      ...formData,
      monthlyIncome: parseFloat(formData.monthlyIncome),
      createdAt: new Date().toISOString(),
      kycStatus: 'completed'
    };

    customers.push(newCustomer);
      localStorage.setItem('loan_customers', JSON.stringify(customers));

    toast({
      title: "Success",
      description: "Customer added successfully"
    });

    // Reset form
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      idType: '',
      idNumber: '',
      occupation: '',
      monthlyIncome: ''
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">New Customer Registration</h2>
        <p className="text-gray-600">Complete KYC process for new customer</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Customer Information & KYC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation *</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => handleChange('occupation', e.target.value)}
                  placeholder="Enter occupation"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="monthlyIncome">Monthly Income (₹) *</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => handleChange('monthlyIncome', e.target.value)}
                  placeholder="Enter monthly income"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Enter complete address"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">ID Verification (KYC)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idType">ID Type *</Label>
                  <Select
                    id="idType"
                    value={formData.idType}
                    onChange={(e) => handleChange('idType', e.target.value)}
                    required
                  >
                    <option value="">Select ID Type</option>
                    {idTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID Number *</Label>
                  <Input
                    id="idNumber"
                    value={formData.idNumber}
                    onChange={(e) => handleChange('idNumber', e.target.value)}
                    placeholder="Enter ID number"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="px-8">
                Register Customer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}