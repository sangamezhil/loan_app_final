import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { DollarSign, Search, Calendar, Zap, Lock } from 'lucide-react';

export function Collections() {
  const { toast } = useToast();
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [collectionAmount, setCollectionAmount] = useState('');
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [password, setPassword] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'preclose'

  const PRECLOSE_LOAN_PASSWORD = "Preclose@123";

  useEffect(() => {
    loadLoans();
  }, []);

  useEffect(() => {
    updateLoanStatuses();
  }, [loans]);

  useEffect(() => {
    filterLoans();
  }, [loans, searchTerm]);

  const loadLoans = () => {
    const storedLoans = JSON.parse(localStorage.getItem('loan_loans') || '[]');
    const customers = JSON.parse(localStorage.getItem('loan_customers') || '[]');
    
    const loansWithCustomers = storedLoans.map(loan => {
      const customer = customers.find(c => c.id === loan.customerId);
      return { ...loan, customerName: customer?.name || 'Unknown', customerPhone: customer?.phone || '' };
    });
    
    setLoans(loansWithCustomers);
  };

  const updateLoanStatuses = () => {
    const today = new Date();
    const updatedLoans = loans.map(loan => {
      if (loan.status !== 'active') return loan;

      const updatedSchedule = loan.repaymentSchedule?.map(schedule => {
        const dueDate = new Date(schedule.dueDate);
        if (schedule.status === 'pending' && dueDate < today) {
          return { ...schedule, status: 'overdue' };
        }
        return schedule;
      });

      return { ...loan, repaymentSchedule: updatedSchedule };
    });

    if (JSON.stringify(updatedLoans) !== JSON.stringify(loans)) {
      setLoans(updatedLoans);
      localStorage.setItem('sbf_loans', JSON.stringify(updatedLoans.map(({ customerName, customerPhone, ...loan }) => loan)));
    }
  };

  const filterLoans = () => {
    const filtered = loans.filter(loan => 
      loan.status === 'active' && (
        loan.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.customerPhone.includes(searchTerm) ||
        loan.id.includes(searchTerm)
      )
    );
    setFilteredLoans(filtered);
  };

  const getNextDueDate = (loan) => {
    const pendingSchedules = loan.repaymentSchedule?.filter(s => s.status === 'pending' || s.status === 'overdue') || [];
    if (pendingSchedules.length === 0) return null;
    
    return pendingSchedules.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
  };

  const getOverdueCount = (loan) => {
    return loan.repaymentSchedule?.filter(s => s.status === 'overdue').length || 0;
  };

  const getPaidAmount = (loanId) => {
    const collections = JSON.parse(localStorage.getItem('loan_collections') || '[]');
    return collections.filter(c => c.loanId === loanId).reduce((sum, c) => sum + c.amount, 0);
  };

  const handleSelectLoan = (loan) => {
    setSelectedLoan(loan);
    const nextDue = getNextDueDate(loan);
    if (nextDue) {
      const dueAmount = nextDue.amount - (nextDue.paidAmount || 0);
      setCollectionAmount(dueAmount > 0 ? dueAmount.toString() : '');
    } else {
      const paidAmount = getPaidAmount(loan.id);
      const outstanding = loan.totalAmount - paidAmount;
      setCollectionAmount(outstanding > 0 ? outstanding.toString() : '');
    }
  };

  const handleCollection = () => {
    if (!selectedLoan || !collectionAmount) {
      toast({ title: "Error", description: "Please select a loan and enter collection amount", variant: "destructive" });
      return;
    }

    const amount = parseFloat(collectionAmount);
    if (amount <= 0) {
      toast({ title: "Error", description: "Collection amount must be greater than 0", variant: "destructive" });
      return;
    }

    const paidAmount = getPaidAmount(selectedLoan.id);
    const outstanding = selectedLoan.totalAmount - paidAmount;
    
    if (amount > outstanding) {
      toast({ title: "Error", description: `Amount cannot exceed outstanding ₹${outstanding.toLocaleString()}`, variant: "destructive" });
      return;
    }

    const collections = JSON.parse(localStorage.getItem('loan_collections') || '[]');
    collections.push({
      id: Date.now().toString(),
      loanId: selectedLoan.id,
      customerId: selectedLoan.customerId,
      amount: amount,
      date: collectionDate,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('loan_collections', JSON.stringify(collections));

    const updatedLoans = JSON.parse(localStorage.getItem('loan_loans') || '[]');
    const loanIndex = updatedLoans.findIndex(l => l.id === selectedLoan.id);
    
    if (loanIndex !== -1) {
      let remainingAmount = amount;
      const updatedSchedule = updatedLoans[loanIndex].repaymentSchedule.map(schedule => {
        if (remainingAmount > 0 && (schedule.status === 'pending' || schedule.status === 'overdue')) {
          const payableAmount = Math.min(remainingAmount, schedule.amount - (schedule.paidAmount || 0));
          const newPaidAmount = (schedule.paidAmount || 0) + payableAmount;
          remainingAmount -= payableAmount;
          
          return {
            ...schedule,
            paidAmount: newPaidAmount,
            status: newPaidAmount >= schedule.amount ? 'paid' : schedule.status,
            paidDate: newPaidAmount >= schedule.amount ? collectionDate : schedule.paidDate
          };
        }
        return schedule;
      });

      updatedLoans[loanIndex].repaymentSchedule = updatedSchedule;
      
      if ((getPaidAmount(selectedLoan.id) + amount) >= selectedLoan.totalAmount) {
        updatedLoans[loanIndex].status = 'closed';
      }

      localStorage.setItem('loan_loans', JSON.stringify(updatedLoans));
    }

    toast({ title: "Success", description: "Collection recorded successfully" });
    setSelectedLoan(null);
    setCollectionAmount('');
    loadLoans();
  };

  const triggerPreClosure = () => {
    if (!selectedLoan) return;
    const paidAmount = getPaidAmount(selectedLoan.id);
    const outstanding = selectedLoan.totalAmount - paidAmount;
    if (outstanding <= 0) {
      toast({ title: "Info", description: "Loan is already fully paid." });
      return;
    }
    setActionType('preclose');
    setIsPasswordDialogOpen(true);
  };

  const executePreClosure = () => {
    const paidAmount = getPaidAmount(selectedLoan.id);
    const outstanding = selectedLoan.totalAmount - paidAmount;

    const collections = JSON.parse(localStorage.getItem('loan_collections') || '[]');
    collections.push({
      id: Date.now().toString(),
      loanId: selectedLoan.id,
      customerId: selectedLoan.customerId,
      amount: outstanding,
      date: collectionDate,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('loan_collections', JSON.stringify(collections));

    const loans = JSON.parse(localStorage.getItem('loan_loans') || '[]');
    const loanIndex = loans.findIndex(l => l.id === selectedLoan.id);
    if (loanIndex !== -1) {
      loans[loanIndex].status = 'closed';
      loans[loanIndex].repaymentSchedule = loans[loanIndex].repaymentSchedule.map(s => 
        (s.status === 'pending' || s.status === 'overdue') 
          ? { ...s, status: 'paid', paidAmount: s.amount, paidDate: collectionDate } 
          : s
      );
        localStorage.setItem('loan_loans', JSON.stringify(loans));
    }

    toast({ title: "Success", description: "Loan pre-closed successfully." });
    setSelectedLoan(null);
    setCollectionAmount('');
    loadLoans();
  };
  
  const handlePasswordSubmit = () => {
    if (actionType === 'preclose') {
      if (password !== PRECLOSE_LOAN_PASSWORD) {
        toast({ title: "Error", description: "Incorrect password for pre-closure.", variant: "destructive" });
        setPassword('');
        return;
      }
      executePreClosure();
    }
    
    setIsPasswordDialogOpen(false);
    setPassword('');
    setActionType(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Collections Management</h2>
        <p className="text-gray-600">Record loan collections and track payments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Active Loans
              </div>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input placeholder="Search loans..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-48" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredLoans.map(loan => {
                const nextDue = getNextDueDate(loan);
                const overdueCount = getOverdueCount(loan);
                const paidAmount = getPaidAmount(loan.id);
                const outstanding = loan.totalAmount - paidAmount;
                
                return (
                  <div
                    key={loan.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedLoan?.id === loan.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => handleSelectLoan(loan)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{loan.customerName}</p>
                        <p className="text-sm text-gray-600">Loan #{loan.id}</p>
                        <p className="text-sm text-gray-600">Phone: {loan.customerPhone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Outstanding: ₹{outstanding.toLocaleString()}</p>
                        {overdueCount > 0 && (<p className="text-xs text-red-600">{overdueCount} overdue</p>)}
                      </div>
                    </div>
                    {nextDue && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-gray-600">
                          Next Due: {new Date(nextDue.dueDate).toLocaleDateString()} - ₹{nextDue.amount.toLocaleString()}
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${nextDue.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {nextDue.status}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredLoans.length === 0 && (<div className="text-center py-8 text-gray-500">No active loans found</div>)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Calendar className="h-5 w-5 mr-2" />Record Collection</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedLoan ? (
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Selected Loan Details</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Customer:</strong> {selectedLoan.customerName}</p>
                    <p><strong>Outstanding:</strong> ₹{(selectedLoan.totalAmount - getPaidAmount(selectedLoan.id)).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collectionAmount">Collection Amount (₹) *</Label>
                  <Input id="collectionAmount" type="number" value={collectionAmount} onChange={(e) => setCollectionAmount(e.target.value)} placeholder="Enter collection amount" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collectionDate">Collection Date *</Label>
                  <Input id="collectionDate" type="date" value={collectionDate} onChange={(e) => setCollectionDate(e.target.value)} required />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleCollection} className="w-full">Record Collection</Button>
                  <Button type="button" variant="outline" className="w-full" onClick={triggerPreClosure}>
                    <Lock className="mr-2 h-4 w-4" />
                    <Zap className="h-4 w-4 mr-1" />Pre-close
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 text-gray-500">Select a loan to record collection</div>
            )}
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enter Password</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter the password to {actionType === 'preclose' ? 'pre-close this loan' : 'perform this action'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="actionPassword">Password</Label>
            <Input 
              id="actionPassword" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter password" 
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setPassword(''); setActionType(null)}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordSubmit}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}