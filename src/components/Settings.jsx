import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Download, Database, Users as UsersIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { UserManagement } from '@/components/UserManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export function Settings() {
  const { toast } = useToast();
  const [activeSettingsTab, setActiveSettingsTab] = useState("dataBackup");

  const exportDataToExcel = (data, fileName) => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      toast({
        title: "Success",
        description: `${fileName}.xlsx downloaded successfully.`,
      });
    } catch (error) {
      console.error(`Error exporting ${fileName}:`, error);
      toast({
        title: "Error",
        description: `Failed to download ${fileName}.xlsx.`,
        variant: "destructive",
      });
    }
  };

  const handleBackup = (dataType) => {
    let data;
    let fileName;

    switch (dataType) {
      case 'customers':
        data = JSON.parse(localStorage.getItem('loan_customers') || '[]');
        fileName = 'loan_customers_backup';
        break;
      case 'loans':
        data = JSON.parse(localStorage.getItem('loan_loans') || '[]');
        fileName = 'loan_loans_backup';
        break;
      case 'collections':
          data = JSON.parse(localStorage.getItem('loan_collections') || '[]');
        fileName = 'loan_collections_backup';
        break;
      case 'users':
        data = JSON.parse(localStorage.getItem('loan_users') || '[]');
          fileName = 'loan_users_backup';
        break;
      default:
        toast({ title: "Error", description: "Invalid data type for backup.", variant: "destructive" });
        return;
    }

    if (data && data.length > 0) {
      exportDataToExcel(data, fileName);
    } else {
      toast({
        title: "Info",
        description: `No data found for ${dataType} to backup.`,
      });
    }
  };
  
  const handleFullBackup = () => {
    const dataTypes = ['customers', 'loans', 'collections', 'users'];
    let backupSuccessful = false;

    dataTypes.forEach(dataType => {
        const data = JSON.parse(localStorage.getItem(`loan_${dataType}`) || '[]');
      if (data && data.length > 0) {
        exportDataToExcel(data, `loan_${dataType}_backup`);
        backupSuccessful = true;
      }
    });

    if (!backupSuccessful) {
       toast({
        title: "Info",
        description: "No data found for any category to backup.",
      });
    } else {
        toast({
            title: "Full Backup Initiated",
            description: "All available data is being downloaded.",
        });
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600">Manage application settings, data backups, and users.</p>
      </div>

      <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dataBackup">
            <Database className="mr-2 h-4 w-4" /> Data Backup
          </TabsTrigger>
          <TabsTrigger value="userManagement">
            <UsersIcon className="mr-2 h-4 w-4" /> User Management
          </TabsTrigger>
        </TabsList>
        <TabsContent value="dataBackup">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Data Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Download your application data in Excel (CSV) format. It's recommended to perform regular backups.
                All data is currently stored in your browser's localStorage.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button onClick={() => handleBackup('customers')} variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Backup Customers
                </Button>
                <Button onClick={() => handleBackup('loans')} variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Backup Loans
                </Button>
                <Button onClick={() => handleBackup('collections')} variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Backup Collections
                </Button>
                <Button onClick={() => handleBackup('users')} variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Backup Users
                </Button>
                <Button onClick={handleFullBackup} className="md:col-span-2 lg:col-span-1 bg-blue-600 hover:bg-blue-700 text-white">
                  <Download className="mr-2 h-4 w-4" /> Full Data Backup
                </Button>
              </div>
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800">Important Note on Data Storage:</h4>
                <p className="text-sm text-yellow-700">
                  Your application data is currently stored using <strong>localStorage</strong>, which means it's saved directly in your web browser on this computer.
                  This is convenient for quick setup and development. However, for more robust, secure, and shareable data storage, especially for production use,
                  it is highly recommended to migrate to a cloud-based database solution like <strong>Supabase</strong>.
                  You can request this migration in a future prompt.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="userManagement">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}