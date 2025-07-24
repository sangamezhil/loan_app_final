import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Users, Search, Eye, FileText, Zap, Trash2, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerLoans, setCustomerLoans] = useState([]);
  const [actionTarget, setActionTarget] = useState(null); // { type: 'deleteCustomer' | 'deleteLoan' | 'preCloseLoan', item: customerOrLoanObject }
  const [password, setPassword] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const PRECLOSE_LOAN_PASSWORD = "Preclose@123";
  const DELETE_CUSTOMER_PASSWORD = "Customer@123";
  const DELETE_LOAN_PASSWORD = "Deleteloan@123";


  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    const storedCustomers = JSON.parse(localStorage.getItem('loan_customers') || '[]');
    setCustomers(storedCustomers);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.idNumber.includes(searchTerm)
  );

  const viewCustomerProfile = (customer) => {
    setSelectedCustomer(customer);
    const loans = JSON.parse(localStorage.getItem('loan_loans') || '[]');
    const customerLoansData = loans.filter(loan => loan.customerId === customer.id);
    setCustomerLoans(customerLoansData);
  };

  const getCustomerLoanStats = (customerId) => {
    const loans = JSON.parse(localStorage.getItem('loan_loans') || '[]');
    const customerLoans = loans.filter(loan => loan.customerId === customerId);
    
    return {
      total: customerLoans.length,
      active: customerLoans.filter(loan => loan.status === 'active').length,
      closed: customerLoans.filter(loan => loan.status === 'closed').length
    };
  };

  const triggerAction = (type, item) => {
    if (user?.role !== 'admin') {
        toast({ title: "Access Denied", description: "You do not have permission for this action.", variant: "destructive" });
        return;
    }
    setActionTarget({ type, item });
    setIsPasswordDialogOpen(true);
  };

  const handlePasswordSubmit = () => {
    if (!actionTarget) return;

    let correctPassword = '';
    switch (actionTarget.type) {
      case 'preCloseLoan':
        correctPassword = PRECLOSE_LOAN_PASSWORD;
        break;
      case 'deleteCustomer':
        correctPassword = DELETE_CUSTOMER_PASSWORD;
        break;
      case 'deleteLoan':
        correctPassword = DELETE_LOAN_PASSWORD;
        break;
      default:
        toast({ title: "Error", description: "Unknown action.", variant: "destructive" });
        resetPasswordDialog();
        return;
    }

    if (password !== correctPassword) {
      toast({ title: "Error", description: "Incorrect password.", variant: "destructive" });
      setPassword('');
      return;
    }

    // Execute action
    switch (actionTarget.type) {
      case 'preCloseLoan':
        executePreClosure(actionTarget.item);
        break;
      case 'deleteCustomer':
        executeDeleteCustomer(actionTarget.item);
        break;
      case 'deleteLoan':
        executeDeleteLoan(actionTarget.item);
        break;
    }
    resetPasswordDialog();
  };
  
  const resetPasswordDialog = () => {
    setIsPasswordDialogOpen(false);
    setPassword('');
    setActionTarget(null);
  };

  const executePreClosure = (loanToClose) => {
    const collections = JSON.parse(localStorage.getItem('loan_collections') || '[]');
    const paidAmount = collections.filter(c => c.loanId === loanToClose.id).reduce((sum, c) => sum + c.amount, 0);
    const outstanding = loanToClose.totalAmount - paidAmount;

    if (outstanding <= 0) {
      toast({ title: "Info", description: "Loan is already fully paid." });
      return;
    }

    collections.push({
      id: Date.now().toString(),
      loanId: loanToClose.id,
      customerId: loanToClose.customerId,
      amount: outstanding,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('loan_collections', JSON.stringify(collections));

    const loans = JSON.parse(localStorage.getItem('loan_loans') || '[]');
    const loanIndex = loans.findIndex(l => l.id === loanToClose.id);
    if (loanIndex !== -1) {
      loans[loanIndex].status = 'closed';
      localStorage.setItem('loan_loans', JSON.stringify(loans));
    }

    toast({ title: "Success", description: "Loan pre-closed successfully." });
    if (selectedCustomer) viewCustomerProfile(selectedCustomer); // Refresh profile view
  };

  const executeDeleteCustomer = (customerToDelete) => {
    let allCustomers = JSON.parse(localStorage.getItem('loan_customers') || '[]');
    let allLoans = JSON.parse(localStorage.getItem('loan_loans') || '[]');
    
    const customerHasActiveLoans = allLoans.some(loan => loan.customerId === customerToDelete.id && loan.status === 'active');
    if (customerHasActiveLoans) {
        toast({ title: "Error", description: "Cannot delete customer with active loans. Please close or reassign loans first.", variant: "destructive"});
        return;
    }

    allCustomers = allCustomers.filter(c => c.id !== customerToDelete.id);
    allLoans = allLoans.filter(l => l.customerId !== customerToDelete.id); // Also delete associated loans
    // Optionally, delete associated collections as well or handle them as per business logic

    localStorage.setItem('loan_customers', JSON.stringify(allCustomers));
    localStorage.setItem('loan_loans', JSON.stringify(allLoans));
    toast({ title: "Success", description: `Customer ${customerToDelete.name} and associated closed loans deleted.` });
    loadCustomers(); // Refresh customer list
    if (selectedCustomer && selectedCustomer.id === customerToDelete.id) {
        setSelectedCustomer(null); // Close profile if it was the deleted customer
    }
  };
  
  const executeDeleteLoan = (loanToDelete) => {
    let allLoans = JSON.parse(localStorage.getItem('loan_loans') || '[]');
    
    if (loanToDelete.status === 'active') {
        toast({ title: "Error", description: "Cannot delete an active loan. Pre-close it first.", variant: "destructive"});
        return;
    }

    allLoans = allLoans.filter(l => l.id !== loanToDelete.id);
    // Optionally, delete associated collections
    localStorage.setItem('loan_loans', JSON.stringify(allLoans));
    toast({ title: "Success", description: `Loan ${loanToDelete.id} deleted.` });
    if (selectedCustomer) viewCustomerProfile(selectedCustomer); // Refresh profile view
  };


  const LoanTrackingTable = ({ loans }) => {
      const collections = JSON.parse(localStorage.getItem('loan_collections') || '[]');
    const calculatePaidAmount = (loanId) => collections.filter(c => c.loanId === loanId).reduce((sum, c) => sum + c.amount, 0);

    return (
      <div className="space-y-4">
        {loans.map(loan => {
          const paidAmount = calculatePaidAmount(loan.id);
          const outstanding = loan.totalAmount - paidAmount;
          
          return (
            <Card key={loan.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Loan #{loan.id} ({loan.status})</CardTitle>
                <div className="flex space-x-2">
                  {loan.status === 'active' && user?.role === 'admin' && (
                    <Button size="sm" variant="outline" onClick={() => triggerAction('preCloseLoan', loan)}>
                      <Lock className="mr-1 h-3 w-3" />
                      <Zap className="h-4 w-4 mr-1" />Pre-close
                    </Button>
                  )}
                  {loan.status !== 'active' && user?.role === 'admin' && (
                     <Button size="sm" variant="destructive" onClick={() => triggerAction('deleteLoan', loan)}>
                        <Lock className="mr-1 h-3 w-3" />
                        <Trash2 className="h-4 w-4 mr-1" />Delete Loan
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div><p className="text-sm text-gray-600">Principal</p><p className="font-semibold">₹{loan.principal.toLocaleString()}</p></div>
                  <div><p className="text-sm text-gray-600">Total to Repay</p><p className="font-semibold">₹{loan.totalAmount.toLocaleString()}</p></div>
                  <div><p className="text-sm text-gray-600">Paid</p><p className="font-semibold text-green-600">₹{paidAmount.toLocaleString()}</p></div>
                  <div><p className="text-sm text-gray-600">Outstanding</p><p className="font-semibold text-orange-600">₹{outstanding.toLocaleString()}</p></div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Repayment Schedule</h4>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b"><th className="text-left p-2">Due Date</th><th className="text-left p-2">Amount</th><th className="text-left p-2">Status</th></tr></thead>
                      <tbody>
                        {loan.repaymentSchedule?.map((schedule, index) => (
                          <tr key={index} className={`border-b ${schedule.status === 'overdue' ? 'text-red-600' : schedule.status === 'paid' ? 'text-green-600' : ''}`}>
                            <td className="p-2">{new Date(schedule.dueDate).toLocaleDateString()}</td>
                            <td className="p-2">₹{schedule.amount.toLocaleString()}</td>
                            <td className="p-2 capitalize">{schedule.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
        <p className="text-gray-600">View and manage customer profiles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center"><Users className="h-5 w-5 mr-2" />Customer List</div>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input placeholder="Search customers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b"><th className="text-left p-3">Name</th><th className="text-left p-3">Phone</th><th className="text-left p-3">ID Type</th><th className="text-left p-3">ID Number</th><th className="text-left p-3">Loans</th><th className="text-left p-3">Actions</th></tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => {
                  const loanStats = getCustomerLoanStats(customer.id);
                  return (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{customer.name}</td>
                      <td className="p-3">{customer.phone}</td>
                      <td className="p-3">{customer.idType}</td>
                      <td className="p-3">{customer.idNumber}</td>
                      <td className="p-3"><span className="text-sm">Total: {loanStats.total} | Active: {loanStats.active} | Closed: {loanStats.closed}</span></td>
                      <td className="p-3 space-x-2">
                        <Dialog onOpenChange={(open) => open && viewCustomerProfile(customer)}>
                          <DialogTrigger asChild><Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" />View</Button></DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Customer Profile - {selectedCustomer?.name}</DialogTitle></DialogHeader>
                            {selectedCustomer && (
                              <div className="space-y-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h3 className="font-semibold mb-2">Personal Information</h3>
                                    <div className="space-y-1 text-sm"><p><strong>Phone:</strong> {selectedCustomer.phone}</p><p><strong>Occupation:</strong> {selectedCustomer.occupation}</p><p><strong>Monthly Income:</strong> ₹{selectedCustomer.monthlyIncome?.toLocaleString()}</p></div>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold mb-2">KYC Information</h3>
                                    <div className="space-y-1 text-sm"><p><strong>ID Type:</strong> {selectedCustomer.idType}</p><p><strong>ID Number:</strong> {selectedCustomer.idNumber}</p></div>
                                  </div>
                                </div>
                                <div>
                                  <h3 className="font-semibold mb-4 flex items-center"><FileText className="h-4 w-4 mr-2" />Loan History & Tracking</h3>
                                  {customerLoans.length > 0 ? <LoanTrackingTable loans={customerLoans} /> : <p className="text-gray-500">No loans found for this customer.</p>}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        {user?.role === 'admin' && (
                          <Button variant="destructive" size="sm" onClick={() => triggerAction('deleteCustomer', customer)}>
                            <Lock className="mr-1 h-3 w-3" />
                            <Trash2 className="h-4 w-4 mr-1" />Del
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredCustomers.length === 0 && (<div className="text-center py-8 text-gray-500">No customers found</div>)}
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enter Password</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter the password to {actionTarget?.type?.replace(/([A-Z])/g, ' $1').toLowerCase() || 'perform this action'}.
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
            <AlertDialogCancel onClick={resetPasswordDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordSubmit}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}