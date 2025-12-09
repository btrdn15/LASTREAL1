import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, History, Loader2, Receipt, Calendar, Clock, Trash2, FileDown } from "lucide-react";
import type { Transaction } from "@shared/schema";

export default function HistoryPage() {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [restoreStock, setRestoreStock] = useState(true);

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, restoreStock }: { id: string; restoreStock: boolean }) => {
      return apiRequest("DELETE", `/api/transactions/${id}?restoreStock=${restoreStock}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Амжилттай",
        description: restoreStock ? "Гүйлгээ устгагдаж, бараа буцаагдлаа" : "Гүйлгээ устгагдлаа",
      });
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Алдаа",
        description: error.message || "Гүйлгээ устгахад алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Ulaanbaatar",
    });
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString("mn-MN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ulaanbaatar",
    });
  }

  function handleDownloadCSV() {
    const link = document.createElement("a");
    link.href = "/api/transactions/csv";
    link.download = `transactions-${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleDownloadTransactionCSV(transactionId: string) {
    const link = document.createElement("a");
    link.href = `/api/transactions/${transactionId}/csv`;
    link.download = `transaction-${transactionId.substring(0, 8)}-${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleDownloadTodayCSV() {
    const link = document.createElement("a");
    link.href = "/api/transactions/today/csv";
    link.download = `transactions-today-${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleDeleteClick(transaction: Transaction) {
    setTransactionToDelete(transaction);
    setRestoreStock(true);
    setDeleteDialogOpen(true);
  }

  function handleConfirmDelete() {
    if (transactionToDelete) {
      deleteMutation.mutate({ id: transactionToDelete.id, restoreStock });
    }
  }

  const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalTransactions = transactions.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Нийт гүйлгээ</p>
                  <p className="text-xl md:text-2xl font-bold" data-testid="text-total-transactions">{totalTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Нийт орлого</p>
                  <p className="text-xl md:text-2xl font-bold truncate" data-testid="text-total-revenue">{totalRevenue.toLocaleString()}₮</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleDownloadTodayCSV}
            disabled={transactions.length === 0}
            className="flex-1 text-base md:text-sm h-10 md:h-10"
            data-testid="button-download-today-csv"
          >
            <Download className="mr-2 h-4 w-4" />
            Өнөөдрийн Тооцоо
          </Button>
          <Button 
            onClick={handleDownloadCSV}
            disabled={transactions.length === 0}
            className="flex-1 text-base md:text-sm h-10 md:h-10"
            data-testid="button-download-csv"
          >
            <Download className="mr-2 h-4 w-4" />
            CSV татах
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Гүйлгээний түүх
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">Гүйлгээний түүх хоосон байна</p>
              <p className="text-xs mt-1">Борлуулалт хийснээр энд харагдана</p>
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((transaction, index) => (
                <div 
                  key={transaction.id} 
                  className="p-4 hover-elevate"
                  data-testid={`row-transaction-${transaction.id}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 md:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-3">
                        <span className="text-xs md:text-sm font-medium text-muted-foreground">
                          #{transactions.length - index}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                          <span data-testid={`text-transaction-date-${transaction.id}`}>
                            {formatDate(transaction.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                          <span data-testid={`text-transaction-time-${transaction.id}`}>
                            {formatTime(transaction.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-0.5 md:space-y-1">
                        {transaction.customerName && (
                          <p className="text-xs md:text-sm font-medium text-primary mb-2" data-testid={`text-customer-name-${transaction.id}`}>
                            Үйлчүүлэгч: {transaction.customerName}
                          </p>
                        )}
                        {transaction.items.map((item, itemIndex) => (
                          <div 
                            key={itemIndex}
                            className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-xs md:text-sm"
                            data-testid={`text-transaction-item-${transaction.id}-${itemIndex}`}
                          >
                            <span className="font-medium break-words">{item.productName}</span>
                            <span className="text-muted-foreground">x{item.quantity} @{item.price.toLocaleString()}₮</span>
                            <span className="sm:ml-auto font-medium text-primary">
                              {(item.quantity * item.price).toLocaleString()}₮
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 md:gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Нийт дүн</p>
                        <p 
                          className="text-lg md:text-xl font-bold text-primary"
                          data-testid={`text-transaction-total-${transaction.id}`}
                        >
                          {transaction.totalAmount.toLocaleString()}₮
                        </p>
                        {transaction.createdBy && (
                          <p className="text-xs text-muted-foreground mt-1 md:mt-2">
                            {transaction.createdBy}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 md:h-8 md:w-8"
                          onClick={() => handleDownloadTransactionCSV(transaction.id)}
                          data-testid={`button-download-transaction-csv-${transaction.id}`}
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 md:h-8 md:w-8 text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => handleDeleteClick(transaction)}
                          data-testid={`button-delete-transaction-${transaction.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Гүйлгээ устгах</AlertDialogTitle>
            <AlertDialogDescription>
              Энэ гүйлгээг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {transactionToDelete && (
            <div className="py-4">
              <div className="rounded-md bg-muted p-3 mb-4">
                <p className="text-sm font-medium mb-2">Гүйлгээний мэдээлэл:</p>
                <p className="text-sm text-muted-foreground">
                  Нийт дүн: {transactionToDelete.totalAmount.toLocaleString()}₮
                </p>
                <p className="text-sm text-muted-foreground">
                  {transactionToDelete.items.length} бүтээгдэхүүн
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="restore-stock" 
                  checked={restoreStock}
                  onCheckedChange={(checked) => setRestoreStock(checked === true)}
                />
                <Label htmlFor="restore-stock" className="text-sm">
                  Барааны тоо хэмжээг буцаах (агуулах руу нэмэх)
                </Label>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Болих</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Устгах
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
