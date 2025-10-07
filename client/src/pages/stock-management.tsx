import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Search, RotateCcw, Package, AlertTriangle, CheckCircle, Edit3, Save, X, Download, Trash2, IndianRupee, ShoppingCart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { generateStockSummaryPDF } from "@/lib/pdf";
import type { MenuItem, Transaction } from "@shared/schema";

type SortField = 'name' | 'category' | 'stockIn' | 'stockOut' | 'stockLeft' | 'revenue' | 'sales' | 'available';
type SortOrder = 'asc' | 'desc';

export default function StockManagementPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isStockSessionActive, setIsStockSessionActive] = useState(false);

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  const selectedMenuSalesDateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : today;
  const { data: menuItemSales = [], isLoading: salesLoading } = useQuery<any[]>({
    queryKey: ["/api/menu/sales", selectedMenuSalesDateString],
    queryFn: async () => {
      const response = await fetch(`/api/menu/sales?date=${selectedMenuSalesDateString}`);
      if (!response.ok) throw new Error('Failed to fetch menu sales');
      return response.json();
    },
  });

  const { data: transactions = [], isLoading: transLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", selectedMenuSalesDateString],
    queryFn: async () => {
      const response = await fetch(`/api/transactions?date=${selectedMenuSalesDateString}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  const totalStockIn = transactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.quantity, 0);
  const totalStockOut = transactions.filter(t => t.type === 'out').reduce((sum, t) => sum + t.quantity, 0);
  const netChange = totalStockIn - totalStockOut;
  const totalRevenue = menuItemSales.reduce((sum, s) => sum + (s.total_price || 0), 0);

  const filteredAndSortedItems = useMemo(() => {
    let items = menuItems.map(item => {
      const itemTransactions = transactions.filter(t => t.itemId === item.id);
      const stockIn = itemTransactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.quantity, 0);
      const stockOut = itemTransactions.filter(t => t.type === 'out').reduce((sum, t) => sum + t.quantity, 0);
      const stockLeft = isStockSessionActive ? stockIn - stockOut : item.stockQuantity + stockIn - stockOut;
      const itemSales = menuItemSales.filter(s => s.item_id === item.id);
      const revenue = itemSales.reduce((sum, s) => sum + (s.total_price || 0), 0);
      const sales = itemSales.reduce((sum, s) => sum + (s.quantity || 0), 0);
      return { ...item, stockIn, stockOut, stockLeft, revenue, sales };
    }).filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return items.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'stockIn':
          aValue = a.stockIn;
          bValue = b.stockIn;
          break;
        case 'stockOut':
          aValue = a.stockOut;
          bValue = b.stockOut;
          break;
        case 'stockLeft':
          aValue = a.stockLeft;
          bValue = b.stockLeft;
          break;
        case 'revenue':
          aValue = a.revenue;
          bValue = b.revenue;
          break;
        case 'sales':
          aValue = a.sales;
          bValue = b.sales;
          break;
        case 'available':
          aValue = a.available ? 1 : 0;
          bValue = b.available ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [menuItems, transactions, menuItemSales, searchQuery, sortField, sortOrder, isStockSessionActive]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleStockUpdate = async (itemId: string) => {
    try {
      const response = await fetch(`/api/stock/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: stockValue }),
      });

      if (response.ok) {
        toast({
          title: "Stock Updated",
          description: "Stock quantity has been updated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
        setEditingStock(null);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update stock",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStock = async (itemId: string, item: any) => {
    try {
      if (isStockSessionActive) {
        // When stock session is active, delete transactions to reset stockLeft to 0
        const response = await fetch(`/api/transactions/item/${itemId}/date/${selectedMenuSalesDateString}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast({
            title: "Stock Left Reset",
            description: "Stock left quantity has been reset to zero.",
          });
          queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
          queryClient.invalidateQueries({ queryKey: ["/api/menu/sales"] });
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to reset stock left",
            variant: "destructive",
          });
        }
      } else {
        // When stock session is inactive, adjust stockQuantity to make stockLeft = 0
        const newStockQuantity = Math.max(0, item.stockQuantity - item.stockLeft);
        const response = await fetch(`/api/stock/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stockQuantity: newStockQuantity }),
        });

        if (response.ok) {
          toast({
            title: "Stock Left Reset",
            description: "Stock left quantity has been reset to zero.",
          });
          queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to reset stock left",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset stock left",
        variant: "destructive",
      });
    }
  };

  const handleResetStock = async (resetType: 'today' | 'all') => {
    try {
      const response = await fetch('/api/stock/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetType }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Stock Reset",
          description: result.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to reset stock",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset stock",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      // First delete all transactions
      const deleteResponse = await fetch('/api/transactions/delete-all', {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete transactions');
      }

      // Then reset all stock quantities to 0
      const resetResponse = await fetch('/api/stock/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetType: 'all' }),
      });

      if (resetResponse.ok) {
        toast({
          title: "All Data Cleared",
          description: "All stock in, out, and left data has been cleared.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      } else {
        throw new Error('Failed to reset stock quantities');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear stock data",
        variant: "destructive",
      });
    }
  };

  const startEditingStock = (item: MenuItem) => {
    setEditingStock(item.id);
    setStockValue(0);
  };

  const getStockStatus = (stockQuantity: number) => {
    if (stockQuantity <= 0) {
      return { status: 'Out of Stock', color: 'destructive', icon: AlertTriangle };
    } else if (stockQuantity <= 10) {
      return { status: 'Low Stock', color: 'secondary', icon: AlertTriangle };
    } else {
      return { status: 'In Stock', color: 'default', icon: CheckCircle };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading stock data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              size="sm"
              className="px-3 py-2 rounded-lg font-semibold hover:bg-secondary hover:text-secondary-foreground transition-colors"
            >
              <ArrowLeft className="mr-2" size={16} />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-secondary">Stock Management</h1>
              <p className="text-sm text-muted-foreground">Manage inventory and stock levels</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-sm"
              >
                Show All
              </Button>
            </div>

            {/* Date Selector */}
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium">Date:</label>
              <Input
                type="date"
                value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : undefined)}
                className="w-40"
              />
            </div>

            {/* Reset Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => handleResetStock('today')}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                disabled={isStockSessionActive}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Today
              </Button>
              <Button
                onClick={() => handleResetStock('all')}
                variant="outline"
                size="sm"
                className="text-green-600 border-green-200 hover:bg-green-50"
                disabled={isStockSessionActive}
              >
                <Package className="w-4 h-4 mr-2" />
                Reset All
              </Button>
            </div>

            {/* Start/End Session Button */}
            <div className="flex gap-2">
              {!isStockSessionActive ? (
                <Button
                  onClick={() => setIsStockSessionActive(true)}
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  Start Day
                </Button>
              ) : (
                <Button
                  onClick={() => setIsStockSessionActive(false)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  End Day
                </Button>
              )}
            </div>

            {/* PDF and Delete Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => generateStockSummaryPDF(filteredAndSortedItems, selectedDate)}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                disabled={isStockSessionActive}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    disabled={isStockSessionActive}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Stock Data</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all stock in and out transactions and reset all item stock quantities to zero. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                      Clear All Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock In ({format(selectedDate || new Date(), 'MMM dd')})</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStockIn}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Out ({format(selectedDate || new Date(), 'MMM dd')})</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStockOut}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Change ({format(selectedDate || new Date(), 'MMM dd')})</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netChange >= 0 ? '+' : ''}{netChange}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue ({format(selectedDate || new Date(), 'MMM dd')})</CardTitle>
              <IndianRupee className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Table */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('name')}
                    >
                      Item Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('category')}
                    >
                      Category {sortField === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('stockIn')}
                    >
                      Stock In {sortField === 'stockIn' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('stockOut')}
                    >
                      Stock Out {sortField === 'stockOut' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('stockLeft')}
                    >
                      Stock Left {sortField === 'stockLeft' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('revenue')}
                    >
                      Revenue {sortField === 'revenue' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('sales')}
                    >
                      Sales {sortField === 'sales' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('available')}
                    >
                      Status {sortField === 'available' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedItems.map((item) => {
                    const stockStatus = getStockStatus(item.stockLeft);
                    const StatusIcon = stockStatus.icon;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.stockIn}</TableCell>
                        <TableCell>{item.stockOut}</TableCell>
                        <TableCell>
                          {editingStock === item.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={stockValue}
                                onChange={(e) => setStockValue(parseInt(e.target.value) || 0)}
                                className="w-20"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleStockUpdate(item.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingStock(null)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className={`font-mono ${item.stockLeft < 0 ? 'text-red-600' : ''}`}>{item.stockLeft}</span>
                          )}
                        </TableCell>
                        <TableCell>₹{item.revenue.toFixed(2)}</TableCell>
                        <TableCell>{item.sales}</TableCell>
                        <TableCell>
                          <Badge
                            variant={stockStatus.color as any}
                            className="flex items-center gap-1 w-fit"
                          >
                            <StatusIcon className="h-3 w-3" />
                            {stockStatus.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditingStock(item)}
                              disabled={editingStock === item.id || isStockSessionActive}
                            >
                              <Edit3 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete Stock
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reset Stock Left Quantity</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will reset the stock left quantity to 0 for "{item.name}". This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteStock(item.id, item)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Reset Stock Left
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredAndSortedItems.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No items match your search.' : 'No stock items found.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}