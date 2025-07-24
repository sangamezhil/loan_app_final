import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileText, AlertTriangle, CheckCircle, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { RecentCollections } from '@/components/RecentCollections';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeLoans: 0,
    overdueLoans: 0,
    closedLoans: 0,
    totalDisbursed: 0,
    outstandingAmount: 0,
    totalCollected: 0
  });

  const [reports, setReports] = useState({
    daily: { disbursed: 0, collected: 0 },
    weekly: { disbursed: 0, collected: 0 },
    monthly: { disbursed: 0, collected: 0 }
  });

  useEffect(() => {
    calculateStats();
  }, []);

  const calculateStats = () => {
    const customers = JSON.parse(localStorage.getItem('loan_customers') || '[]');
    const loans = JSON.parse(localStorage.getItem('loan_loans') || '[]');
    const collections = JSON.parse(localStorage.getItem('loan_collections') || '[]');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    let totalDisbursed = 0;
    let outstandingAmount = 0;
    let activeLoans = 0;
    let overdueLoans = 0;
    let closedLoans = 0;

    loans.forEach(loan => {
      totalDisbursed += loan.disbursedAmount !== undefined ? loan.disbursedAmount : loan.principal;
      
      if (loan.status === 'active') {
        activeLoans++;
        const paidAmount = collections
          .filter(c => c.loanId === loan.id)
          .reduce((sum, c) => sum + c.amount, 0);
        outstandingAmount += (loan.totalAmount - paidAmount);
        
        const schedule = loan.repaymentSchedule || [];
        const hasOverdue = schedule.some(s => 
          s.status === 'pending' && new Date(s.dueDate) < today
        );
        if (hasOverdue) overdueLoans++;
      } else if (loan.status === 'closed') {
        closedLoans++;
      }
    });

    const totalCollected = collections.reduce((sum, c) => sum + c.amount, 0);

    const dailyCollected = collections
      .filter(c => new Date(c.date).toDateString() === today.toDateString())
      .reduce((sum, c) => sum + c.amount, 0);

    const weeklyCollected = collections
      .filter(c => new Date(c.date) >= weekAgo)
      .reduce((sum, c) => sum + c.amount, 0);

    const monthlyCollected = collections
      .filter(c => new Date(c.date) >= monthAgo)
      .reduce((sum, c) => sum + c.amount, 0);

    const dailyDisbursed = loans
      .filter(l => new Date(l.disbursementDate).toDateString() === today.toDateString())
      .reduce((sum, l) => sum + (l.disbursedAmount !== undefined ? l.disbursedAmount : l.principal), 0);

    const weeklyDisbursed = loans
      .filter(l => new Date(l.disbursementDate) >= weekAgo)
      .reduce((sum, l) => sum + (l.disbursedAmount !== undefined ? l.disbursedAmount : l.principal), 0);

    const monthlyDisbursed = loans
      .filter(l => new Date(l.disbursementDate) >= monthAgo)
      .reduce((sum, l) => sum + (l.disbursedAmount !== undefined ? l.disbursedAmount : l.principal), 0);

    setStats({
      totalCustomers: customers.length,
      activeLoans,
      overdueLoans,
      closedLoans,
      totalDisbursed,
      outstandingAmount,
      totalCollected
    });

    setReports({
      daily: { disbursed: dailyDisbursed, collected: dailyCollected },
      weekly: { disbursed: weeklyDisbursed, collected: weeklyCollected },
      monthly: { disbursed: monthlyDisbursed, collected: monthlyCollected }
    });
  };

  const StatCard = ({ title, value, icon: Icon, color = "blue" }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' && title.includes('₹') ? `₹${value.toLocaleString()}` : value.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Overview of your loan management system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Customers" value={stats.totalCustomers} icon={Users} />
        <StatCard title="Active Loans" value={stats.activeLoans} icon={FileText} color="green" />
        <StatCard title="Overdue Loans" value={stats.overdueLoans} icon={AlertTriangle} color="red" />
        <StatCard title="Closed Loans" value={stats.closedLoans} icon={CheckCircle} color="gray" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Disbursed ₹" value={stats.totalDisbursed} icon={DollarSign} color="blue" />
        <StatCard title="Outstanding Amount ₹" value={stats.outstandingAmount} icon={TrendingUp} color="orange" />
        <StatCard title="Total Collected ₹" value={stats.totalCollected} icon={DollarSign} color="green" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Today's Disbursement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      ₹{reports.daily.disbursed.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Today's Collection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ₹{reports.daily.collected.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="weekly" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">This Week's Disbursement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      ₹{reports.weekly.disbursed.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">This Week's Collection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ₹{reports.weekly.collected.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="monthly" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">This Month's Disbursement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      ₹{reports.monthly.disbursed.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">This Month's Collection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ₹{reports.monthly.collected.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <RecentCollections />
    </div>
  );
}