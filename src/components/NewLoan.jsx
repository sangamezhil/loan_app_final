import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { calculateLoanDetails, generateRepaymentSchedule, getInterestRate } from '@/utils/loanCalculations';
import { FileText, Calculator, Lock } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function NewLoan() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customerId: '',
    principal: '',
    repaymentType: '',
    loanTerm: '',
    disbursementDate: new Date().toISOString().split('T')[0]
  });
  const [loanPreview, setLoanPreview] = useState(null);
  const [password, setPassword] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const NEW_LOAN_PASSWORD = "Newloan@123";

  useEffect(() => {
    const storedCustomers = JSON.parse(localStorage.getItem('loan_customers') || '[]');
    setCustomers(storedCustomers);
  }, []);

  useEffect(() => {
    if (formData.principal && formData.repaymentType) {
      calculatePreview();
    } else {
      setLoanPreview(null);
    }
  }, [formData.principal, formData.repaymentType, formData.loanTerm]);

  const calculatePreview = () => {
    try {
      const principal = parseFloat(formData.principal);
      if (!principal || principal <= 0) {
        setLoanPreview(null);
        return;
      };

      const interestRate = getInterestRate(formData.repaymentType, parseInt(formData.loanTerm));
      const loanDetails = calculateLoanDetails(principal, interestRate, formData.repaymentType, formData.loanTerm);
      setLoanPreview(loanDetails);
    } catch (error) {
      console.error('Error calculating loan preview:', error);
      setLoanPreview(null);
    }
  };

  const handlePasswordSubmit = () => {
    if (password !== NEW_LOAN_PASSWORD) {
      toast({ title: "Error", description: "Incorrect password.", variant: "destructive" });
      setPassword('');
      return;
    }
    setIsPasswordDialogOpen(false);
    setPassword('');
    createLoan();
  };

  const triggerLoanCreation = (e) => {
    e.preventDefault();
    if (!formData.customerId || !formData.principal || !formData.repaymentType || !loanPreview) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and ensure calculations are correct.",
        variant: "destructive"
      });
      return;
    }
    setIsPasswordDialogOpen(true);
  };

  const createLoan = () => {
    const allCustomers = JSON.parse(localStorage.getItem('loan_customers') || '[]');
    const customer = allCustomers.find(c => c.id === formData.customerId);

    if (!customer) {
      toast({ title: "Error", description: "Selected customer could not be found.", variant: "destructive" });
      return;
    }

    const loans = JSON.parse(localStorage.getItem('loan_loans') || '[]');
    const existingLoan = loans.find(loan => {
      if (loan.status !== 'active') return false;
      const loanCustomer = allCustomers.find(c => c.id === loan.customerId);
      return loanCustomer && loanCustomer.idNumber === customer.idNumber && loanCustomer.idType === customer.idType;
    });

    if (existingLoan) {
      toast({
        title: "Error",
        description: "An active loan already exists for this customer's ID proof.",
        variant: "destructive"
      });
      return;
    }
    
    const repaymentSchedule = generateRepaymentSchedule(loanPreview, formData.disbursementDate);

    const newLoan = {
      id: Date.now().toString(),
      customerId: formData.customerId,
      ...loanPreview,
      disbursementDate: formData.disbursementDate,
      status: 'active',
      repaymentSchedule: repaymentSchedule,
      createdAt: new Date().toISOString()
    };

    loans.push(newLoan);
    localStorage.setItem('loan_loans', JSON.stringify(loans));

    toast({
      title: "Success",
      description: "Loan created successfully"
    });

    setFormData({
      customerId: '',
      principal: '',
      repaymentType: '',
      loanTerm: '',
      disbursementDate: new Date().toISOString().split('T')[0]
    });
    setLoanPreview(null);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">New Loan Application</h2>
        <p className="text-gray-600">Create a new loan for an existing customer</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Loan Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={triggerLoanCreation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">Select Customer *</Label>
                <Select
                  id="customerId"
                  value={formData.customerId}
                  onChange={(e) => handleChange('customerId', e.target.value)}
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="principal">Loan Amount (Principal) (₹) *</Label>
                <Input
                  id="principal"
                  type="number"
                  value={formData.principal}
                  onChange={(e) => handleChange('principal', e.target.value)}
                  placeholder="Enter loan amount"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repaymentType">Repayment Type *</Label>
                <Select
                  id="repaymentType"
                  value={formData.repaymentType}
                  onChange={(e) => handleChange('repaymentType', e.target.value)}
                  required
                >
                  <option value="">Select Repayment Type</option>
                  <option value="daily">Daily (70 days, 20% interest)</option>
                  <option value="weekly">Weekly (10 weeks, 12-20% interest)</option>
                  <option value="monthly">Monthly (1 month, 20% interest)</option>
                </Select>
              </div>

              {formData.repaymentType === 'weekly' && (
                <div className="space-y-2">
                  <Label htmlFor="loanTerm">Loan Term (weeks)</Label>
                  <Select
                    id="loanTerm"
                    value={formData.loanTerm}
                    onChange={(e) => handleChange('loanTerm', e.target.value)}
                  >
                    <option value="">Select Term</option>
                    <option value="1">1 week (12% interest)</option>
                    <option value="10">10 weeks (20% interest)</option>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="disbursementDate">Disbursement Date *</Label>
                <Input
                  id="disbursementDate"
                  type="date"
                  value={formData.disbursementDate}
                  onChange={(e) => handleChange('disbursementDate', e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                <Lock className="mr-2 h-4 w-4" /> Create Loan
              </Button>
            </form>
          </CardContent>
        </Card>

        {loanPreview && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Loan Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Principal</p>
                    <p className="text-lg font-semibold">₹{loanPreview.principal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="text-lg font-semibold">{loanPreview.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Interest</p>
                    <p className="text-lg font-semibold text-orange-600">₹{loanPreview.totalInterest.toLocaleString()}</p>
                  </div>
                   <div>
                    <p className="text-sm text-gray-600">Disbursed Amount</p>
                    <p className="text-lg font-semibold text-blue-600">₹{loanPreview.disbursedAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total to Repay</p>
                    <p className="text-lg font-semibold">₹{loanPreview.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Installment</p>
                    <p className="text-lg font-semibold text-green-600">₹{loanPreview.installmentAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Repayment Schedule</p>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm">
                      <strong>Type:</strong> {loanPreview.repaymentType.charAt(0).toUpperCase() + loanPreview.repaymentType.slice(1)} ({loanPreview.numberOfInstallments} installments)
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Customer receives ₹{loanPreview.disbursedAmount.toLocaleString()} and repays a total of ₹{loanPreview.totalAmount.toLocaleString()}.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <AlertDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enter Password to Create Loan</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter the password to finalize loan creation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="newLoanPassword">Password</Label>
            <Input 
              id="newLoanPassword" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter password" 
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPassword('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordSubmit}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}