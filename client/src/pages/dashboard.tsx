import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, IndianRupee, Receipt, Trash2, TrendingUp, BarChart3, ArrowLeft, Menu, Settings, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { generateDailySummaryPDF, generateWeeklySummaryPDF, generateMonthlySummaryPDF, generateMenuSalesPDF } from "@/lib/pdf";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format, addDays, parseISO, startOfWeek, endOfWeek, getWeek, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import type { DailySummary, WeeklySummary, MonthlySummary } from "@shared/schema";



type MenuItemSales = {
  name: string;
  count: number;
};

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("today");
  const [clearPeriod, setClearPeriod] = useState<"day" | "week" | "month">("day");
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedWeekDate, setSelectedWeekDate] = useState<Date | undefined>(new Date());
  const [selectedMenuSalesDate, setSelectedMenuSalesDate] = useState<Date | undefined>(new Date());
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date | undefined>(new Date());

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Week navigation helpers
  const goToPreviousWeek = () => {
    if (selectedWeekDate) {
      const previousWeek = addDays(selectedWeekDate, -7);
      setSelectedWeekDate(previousWeek);
    }
  };

  const goToNextWeek = () => {
    if (selectedWeekDate) {
      const nextWeek = addDays(selectedWeekDate, 7);
      setSelectedWeekDate(nextWeek);
    }
  };

  const goToCurrentWeek = () => {
    setSelectedWeekDate(new Date());
  };

  // Month navigation helpers
  const goToPreviousMonth = () => {
    if (selectedMonthDate) {
      const previousMonth = subMonths(selectedMonthDate, 1);
      setSelectedMonthDate(previousMonth);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonthDate) {
      const nextMonth = addMonths(selectedMonthDate, 1);
      setSelectedMonthDate(nextMonth);
    }
  };

  const goToCurrentMonth = () => {
    setSelectedMonthDate(new Date());
  };

  const { data: dailySummaries = [] } = useQuery<DailySummary[]>({
    queryKey: ["/api/summaries/daily"],
  });

  const { data: weeklySummaries = [] } = useQuery<WeeklySummary[]>({
    queryKey: ["/api/summaries/weekly"],
  });

  const { data: monthlySummaries = [] } = useQuery<MonthlySummary[]>({
    queryKey: ["/api/summaries/monthly"],
  });



  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(addDays(new Date(), -1), 'yyyy-MM-dd');
  const selectedMenuSalesDateString = selectedMenuSalesDate ? format(selectedMenuSalesDate, 'yyyy-MM-dd') : today;
  const { data: menuItemSales = [], isLoading: menuItemSalesLoading, error: menuItemSalesError } = useQuery<any[]>({
    queryKey: ["/api/menu/sales", selectedMenuSalesDateString],
    queryFn: async () => {
      const response = await fetch(`/api/menu/sales?date=${selectedMenuSalesDateString}`);
      if (!response.ok) throw new Error('Failed to fetch menu sales');
      return response.json();
    },
  });

  const todaySummary = dailySummaries.find(s => s.date === today);
  const yesterdaySummary = dailySummaries.find(s => s.date === yesterday);
  
  // Find the week that contains the selected week date
  const selectedWeekDateString = selectedWeekDate ? format(selectedWeekDate, 'yyyy-MM-dd') : today;
  const currentWeek = weeklySummaries.find(week => {
    const weekStart = new Date(week.weekStart);
    const weekEnd = new Date(week.weekEnd);
    const selectedDate = new Date(selectedWeekDateString);
    return selectedDate >= weekStart && selectedDate <= weekEnd;
  });
  
  // Find the month that matches the selected month date
  const selectedMonthString = selectedMonthDate ? format(selectedMonthDate, 'yyyy-MM') : format(new Date(), 'yyyy-MM');
  const currentMonth = monthlySummaries.find(month => month.month === selectedMonthString);

  const selectedDateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const { data: selectedSummary = null } = useQuery<DailySummary | null>({
    queryKey: selectedDateString ? ["/api/summaries/daily", selectedDateString] : [],
    queryFn: selectedDateString ? async () => {
      const response = await fetch(`/api/summaries/daily/${selectedDateString}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch selected daily summary');
      }
      return response.json();
    } : undefined,
    enabled: !!selectedDateString,
  });

  // Generate week dates with sales data for display
  const getWeekDatesWithSales = (weekStart: string, dailySummaries: DailySummary[]) => {
    try {
      const startDate = parseISO(weekStart);
      const weekDates = [];
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      
      for (let i = 0; i < 7; i++) {
        const date = addDays(startDate, i);
        const dateString = format(date, 'yyyy-MM-dd');
        const dailySummary = dailySummaries.find(summary => summary.date === dateString);
        
        weekDates.push({
          day: dayNames[i],
          date: format(date, 'dd/MM'),
          fullDate: dateString,
          totalAmount: dailySummary?.totalAmount || '0.00'
        });
      }
      return weekDates;
    } catch (error) {
      return [];
    }
  };

  const weekDates = currentWeek ? getWeekDatesWithSales(currentWeek.weekStart, dailySummaries) : [];



  // Prepare chart data with colors
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'];
  
  const chartData = menuItemSales
    .filter(item => item.totalSold > 0) // Only show items with sales
    .slice(0, 10)
    .map((item, index) => ({
      name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
      fullName: item.name,
      count: item.totalSold || 0,
      revenue: item.revenue || 0,
      color: COLORS[index % COLORS.length],
    }));

  const chartConfig = {
    sales: {
      label: "Sales Count",
      color: "hsl(var(--primary))",
    },
  };

  const handleClearData = async () => {
    try {
      let dateParam = today;
      
      if (clearPeriod === 'week') {
        // Get Monday of current week
        const currentDate = new Date();
        const day = currentDate.getDay();
        const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(currentDate.setDate(diff));
        dateParam = format(monday, 'yyyy-MM-dd');
      } else if (clearPeriod === 'month') {
        dateParam = today.substring(0, 7); // YYYY-MM format
      }

      const response = await fetch(`/api/data/clear?period=${clearPeriod}&date=${dateParam}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Data Cleared",
          description: result.message,
        });
        
        // Refresh all queries
        queryClient.invalidateQueries({ queryKey: ["/api/summaries/daily"] });
        queryClient.invalidateQueries({ queryKey: ["/api/summaries/weekly"] });
        queryClient.invalidateQueries({ queryKey: ["/api/summaries/monthly"] });
        queryClient.invalidateQueries({ queryKey: ["/api/menu/sales"] });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to clear data",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear data",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDaily = async () => {
    if (!todaySummary) return;
    
    try {
      await generateDailySummaryPDF(todaySummary, []);
    } catch (error) {
      console.error("Failed to generate daily PDF:", error);
    }
  };

  const handleDownloadDailyByDate = async () => {
    if (!selectedDate) {
      toast({
        title: "No Date Selected",
        description: "Please select a date first",
        variant: "destructive",
      });
      return;
    }

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    
    try {
      const response = await fetch(`/api/summaries/daily/${dateString}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "No Summary Available",
            description: "No daily summary available for the selected date",
            variant: "destructive",
          });
          return;
        }
        throw new Error('Failed to fetch daily summary');
      }
      
      const summary = await response.json();
      await generateDailySummaryPDF(summary, []);
      toast({
        title: "PDF Downloaded",
        description: `Daily summary for ${format(selectedDate, 'MMM dd, yyyy')} has been downloaded`,
      });
    } catch (error) {
      console.error("Failed to generate daily PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate daily summary PDF",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDailyByDate = async () => {
    if (!selectedDate) {
      toast({
        title: "No Date Selected",
        description: "Please select a date first",
        variant: "destructive",
      });
      return;
    }

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    
    try {
      const response = await fetch(`/api/data/clear?period=day&date=${dateString}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Data Deleted",
          description: `Daily summary for ${format(selectedDate, 'MMM dd, yyyy')} has been deleted`,
        });
        
        // Refresh all queries
        queryClient.invalidateQueries({ queryKey: ["/api/summaries/daily"] });
        queryClient.invalidateQueries({ queryKey: ["/api/summaries/weekly"] });
        queryClient.invalidateQueries({ queryKey: ["/api/summaries/monthly"] });
        queryClient.invalidateQueries({ queryKey: ["/api/menu/sales"] });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete daily summary",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete daily summary",
        variant: "destructive",
      });
    }
  };

  const handleDownloadWeekly = async () => {
    if (!selectedWeekDate) {
      toast({
        title: "No Date Selected",
        description: "Please select a date to view weekly summary",
        variant: "destructive",
      });
      return;
    }

    if (!currentWeek) {
      toast({
        title: "No Summary Available",
        description: "No weekly summary available for the selected date",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await generateWeeklySummaryPDF(currentWeek, [], dailySummaries);
      toast({
        title: "PDF Downloaded",
        description: `Weekly summary for ${currentWeek.weekStart} to ${currentWeek.weekEnd} has been downloaded`,
      });
    } catch (error) {
      console.error("Failed to generate weekly PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate weekly summary PDF",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWeekly = async () => {
    if (!selectedWeekDate) {
      toast({
        title: "No Date Selected",
        description: "Please select a date first",
        variant: "destructive",
      });
      return;
    }

    if (!currentWeek) {
      toast({
        title: "No Summary Available",
        description: "No weekly summary available for the selected date",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/data/clear?period=week&date=${currentWeek.weekStart}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Data Deleted",
          description: `Weekly summary for ${currentWeek.weekStart} to ${currentWeek.weekEnd} has been deleted`,
        });
        
        // Refresh all queries
        queryClient.invalidateQueries({ queryKey: ["/api/summaries/daily"] });
        queryClient.invalidateQueries({ queryKey: ["/api/summaries/weekly"] });
        queryClient.invalidateQueries({ queryKey: ["/api/summaries/monthly"] });
        queryClient.invalidateQueries({ queryKey: ["/api/menu/sales"] });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete weekly summary",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete weekly summary",
        variant: "destructive",
      });
    }
  };

  const handleDownloadMonthly = async () => {
    if (!currentMonth) {
      toast({
        title: "No Summary Available",
        description: "No monthly summary available",
        variant: "destructive",
      });
      return;
    }

    try {
      // Filter daily summaries for the current month
      const monthDailySummaries = dailySummaries.filter(summary =>
        summary.date.startsWith(currentMonth.month)
      );

      // Filter weekly summaries for the current month
      const monthWeeklySummaries = weeklySummaries.filter(summary =>
        summary.weekStart.startsWith(currentMonth.month) ||
        summary.weekEnd.startsWith(currentMonth.month)
      );

      await generateMonthlySummaryPDF(currentMonth, monthDailySummaries, monthWeeklySummaries);
      toast({
        title: "PDF Downloaded",
        description: `Monthly summary for ${currentMonth.month} has been downloaded`,
      });
    } catch (error) {
      console.error("Failed to generate monthly PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate monthly summary PDF",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMonthly = async () => {
    if (!currentMonth) {
      toast({
        title: "No Summary Available",
        description: "No monthly summary available to delete",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/data/clear?period=month&date=${currentMonth.month}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Data Deleted",
          description: `Monthly summary for ${currentMonth.month} has been deleted`,
        });
        
        // Refresh all queries
        queryClient.invalidateQueries({ queryKey: ["/api/summaries/daily"] });
        queryClient.invalidateQueries({ queryKey: ["/api/summaries/weekly"] });
        queryClient.invalidateQueries({ queryKey: ["/api/summaries/monthly"] });
        queryClient.invalidateQueries({ queryKey: ["/api/menu/sales"] });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete monthly summary",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete monthly summary",
        variant: "destructive",
      });
    }
  };

  const handleDownloadMenuSales = async () => {
    if (!selectedMenuSalesDate) {
      toast({
        title: "No Date Selected",
        description: "Please select a date first",
        variant: "destructive",
      });
      return;
    }

    if (!menuItemSales || menuItemSales.length === 0) {
      toast({
        title: "No Summary Available",
        description: "No summary available for the selected date",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Transform the data to match the expected format for PDF generation
      const transformedData = menuItemSales.map(item => ({
        name: item.name,
        count: item.totalSold || 0
      }));
      
      await generateMenuSalesPDF(transformedData, selectedMenuSalesDate);
      toast({
        title: "PDF Downloaded",
        description: `Menu sales report for ${format(selectedMenuSalesDate, 'MMM dd, yyyy')} has been downloaded successfully`,
      });
    } catch (error) {
      console.error("Failed to generate menu sales PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate menu sales PDF",
        variant: "destructive",
      });
    }
  };



  return (
    <div className="min-h-screen bg-background px-2 py-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col gap-3 mb-4 sm:mb-6">
          {/* Title and Navigation Row */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate("/menu")}
                variant="outline"
                size="sm"
                className="px-3 py-2 rounded-lg font-semibold hover:bg-secondary hover:text-secondary-foreground transition-colors"
              >
                <ArrowLeft className="mr-2" size={16} />
                <span className="hidden xs:inline">Back to Menu</span>
                <span className="xs:hidden">Back</span>
              </Button>
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-secondary" data-testid="dashboard-title">Dashboard</h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground" data-testid="dashboard-subtitle">Transaction summaries and analytics</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-start">
              <Button
                onClick={() => navigate("/stock-management")}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50 w-full sm:w-auto"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                <span className="hidden xs:inline">Stock Management</span>
                <span className="xs:hidden">Stock</span>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto">
                    <Trash2 className="w-4 h-4 mr-2" />
                    <span className="hidden xs:inline">Clear Data</span>
                    <span className="xs:hidden">Clear</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[95vw] max-w-lg mx-2">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Data</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                      This action will permanently delete data from both frontend and MongoDB backend. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4 space-y-3">
                    <label className="text-sm font-medium">Select period to clear:</label>
                    <Select value={clearPeriod} onValueChange={(value: "day" | "week" | "month") => setClearPeriod(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Today's Data</SelectItem>
                        <SelectItem value="week">This Week's Data</SelectItem>
                        <SelectItem value="month">This Month's Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row">
                    <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData} className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
                      Clear Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Period Selection Buttons */}
          <div className="flex flex-wrap justify-center gap-1 sm:justify-start sm:gap-2">
            <Button
              variant={selectedPeriod === "today" ? "default" : "secondary"}
              onClick={() => setSelectedPeriod("today")}
              data-testid="button-period-today"
              size="sm"
              className="px-2 py-1 text-xs min-w-[70px] sm:min-w-[80px] sm:px-3 sm:py-2 sm:text-sm"
            >
              Today
            </Button>
            <Button
              variant={selectedPeriod === "week" ? "default" : "secondary"}
              onClick={() => setSelectedPeriod("week")}
              data-testid="button-period-week"
              size="sm"
              className="px-2 py-1 text-xs min-w-[70px] sm:min-w-[80px] sm:px-3 sm:py-2 sm:text-sm"
            >
              Week
            </Button>
            <Button
              variant={selectedPeriod === "month" ? "default" : "secondary"}
              onClick={() => setSelectedPeriod("month")}
              data-testid="button-period-month"
              size="sm"
              className="px-2 py-1 text-xs min-w-[70px] sm:min-w-[80px] sm:px-3 sm:py-2 sm:text-sm"
            >
              Month
            </Button>
          </div>

          {/* Date-based Actions */}
          <div className="flex flex-wrap justify-center gap-1 sm:justify-start sm:gap-2 mt-3">
            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`px-2 py-1 text-xs justify-start text-left font-normal date-picker-button sm:px-3 sm:py-2 sm:text-sm ${
                      selectedDate ? "text-foreground bg-blue-50 border-blue-200 hover:bg-blue-100" : "text-muted-foreground"
                    }`}
                    data-selected={selectedDate ? "true" : "false"}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 calendar-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
              
              <Button
                onClick={handleDownloadDailyByDate}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs sm:px-3 sm:py-2 sm:text-sm"
                disabled={!selectedDate}
              >
                <Download className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Download Daily Summary PDF</span>
                <span className="xs:hidden">Download</span>
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 px-2 py-1 text-xs sm:px-3 sm:py-2 sm:text-sm"
                    disabled={!selectedDate}
                  >
                    <Trash2 className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Delete Daily Summary</span>
                    <span className="xs:hidden">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[95vw] max-w-lg mx-2">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Daily Summary</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                      Are you sure you want to delete the daily summary for {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'the selected date'}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row">
                    <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteDailyByDate} className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
                      Delete Summary
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <IndianRupee className="text-primary text-base sm:text-lg" />
                </div>
                <span className="text-xs text-muted-foreground" data-testid="text-today-label">Today</span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-secondary mb-1" data-testid="text-daily-total">
                ₹{todaySummary?.totalAmount || "0.00"}
              </div>
              <div className="text-xs text-green-600" data-testid="text-daily-growth">
                {yesterdaySummary && todaySummary ?
                  `${((parseFloat(todaySummary.totalAmount) - parseFloat(yesterdaySummary.totalAmount)) / parseFloat(yesterdaySummary.totalAmount) * 100) >= 0 ? '+' : ''}${((parseFloat(todaySummary.totalAmount) - parseFloat(yesterdaySummary.totalAmount)) / parseFloat(yesterdaySummary.totalAmount) * 100).toFixed(1)}% from yesterday`
                  : '+0% from yesterday'
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-base sm:text-lg font-bold">O</span>
                </div>
                <span className="text-xs text-muted-foreground" data-testid="text-gpay-label">Online Payments</span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-secondary mb-1" data-testid="text-gpay-total">
                ₹{todaySummary?.gpayAmount || "0.00"}
              </div>
              <div className="text-xs text-muted-foreground" data-testid="text-gpay-percentage">
                {todaySummary ? Math.round((parseFloat(todaySummary.gpayAmount) / parseFloat(todaySummary.totalAmount)) * 100) : 0}% of total
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-500/10 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 text-base sm:text-lg">₹</span>
                </div>
                <span className="text-xs text-muted-foreground" data-testid="text-cash-label">Cash</span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-secondary mb-1" data-testid="text-cash-total">
                ₹{todaySummary?.cashAmount || "0.00"}
              </div>
              <div className="text-xs text-muted-foreground" data-testid="text-cash-percentage">
                {todaySummary ? Math.round((parseFloat(todaySummary.cashAmount) / parseFloat(todaySummary.totalAmount)) * 100) : 0}% of total
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Receipt className="text-blue-600 text-base sm:text-lg" />
                </div>
                <span className="text-xs text-muted-foreground" data-testid="text-orders-label">Orders</span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-secondary mb-1" data-testid="text-order-count">
                {todaySummary?.orderCount || 0}
              </div>
              <div className="text-xs text-green-600" data-testid="text-order-growth">
                {yesterdaySummary && todaySummary ?
                  `${(todaySummary.orderCount - yesterdaySummary.orderCount) >= 0 ? '+' : ''}${todaySummary.orderCount - yesterdaySummary.orderCount} from yesterday`
                  : '+0 from yesterday'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Date Summary Cards */}
        {selectedSummary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <IndianRupee className="text-purple-600 text-base sm:text-lg" />
                  </div>
                  <span className="text-xs text-muted-foreground">Selected Date</span>
                </div>
                <div className="text-lg sm:text-xl font-bold text-secondary mb-1">
                  ₹{selectedSummary?.totalAmount || "0.00"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedSummary?.orderCount || 0} orders
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-base sm:text-lg font-bold">O</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Online Payments</span>
                </div>
                <div className="text-lg sm:text-xl font-bold text-secondary mb-1">
                  ₹{selectedSummary?.gpayAmount || "0.00"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedSummary ? Math.round((parseFloat(selectedSummary.gpayAmount) / parseFloat(selectedSummary.totalAmount)) * 100) : 0}% of total
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-500/10 rounded-lg flex items-center justify-center">
                    <span className="text-gray-600 text-base sm:text-lg">₹</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Cash</span>
                </div>
                <div className="text-lg sm:text-xl font-bold text-secondary mb-1">
                  ₹{selectedSummary?.cashAmount || "0.00"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedSummary ? Math.round((parseFloat(selectedSummary.cashAmount) / parseFloat(selectedSummary.totalAmount)) * 100) : 0}% of total
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Receipt className="text-blue-600 text-base sm:text-lg" />
                  </div>
                  <span className="text-xs text-muted-foreground">Orders</span>
                </div>
                <div className="text-lg sm:text-xl font-bold text-secondary mb-1">
                  {selectedSummary?.orderCount || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : ''}
                </div>
              </CardContent>
            </Card>
          </div>
        )}



        {/* Transaction Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-secondary" data-testid="daily-summary-title">Daily Summary</h2>
                <Button
                  onClick={handleDownloadDaily}
                  className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors w-full sm:w-auto"
                  disabled={!todaySummary}
                  data-testid="button-download-daily"
                >
                  <Download className="mr-2" size={16} />
                  <span className="hidden xs:inline">Download</span>
                  <span className="xs:hidden">PDF</span>
                </Button>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 bg-muted rounded-lg gap-1">
                  <div>
                    <div className="font-medium text-secondary text-sm sm:text-base" data-testid="text-total-sales">Total Sales</div>
                    <div className="text-xs sm:text-sm text-muted-foreground" data-testid="text-today-orders">
                      Today • {todaySummary?.orderCount || 0} orders
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-lg sm:text-xl font-bold text-primary" data-testid="text-today-total">
                      ₹{todaySummary?.totalAmount || "0.00"}
                    </div>
                    <div className="text-xs sm:text-sm text-green-600" data-testid="text-today-change">+0%</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-xs text-green-700 mb-1" data-testid="text-gpay-payments">Online Payments</div>
                    <div className="text-sm sm:text-base font-bold text-green-800" data-testid="text-gpay-amount">
                      ₹{todaySummary?.gpayAmount || "0.00"}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-700 mb-1" data-testid="text-cash-payments">Cash Payments</div>
                    <div className="text-sm sm:text-base font-bold text-gray-800" data-testid="text-cash-amount">
                      ₹{todaySummary?.cashAmount || "0.00"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-secondary" data-testid="weekly-summary-title">Weekly Summary</h2>
                <div className="flex flex-col sm:flex-row gap-2 sm:flex-wrap sm:justify-end">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousWeek}
                      className="px-2 hover:bg-blue-50 hover:border-blue-300"
                      title="Previous Week"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`flex-1 sm:w-auto justify-start text-left font-normal transition-all ${
                            selectedWeekDate 
                              ? "bg-blue-50 border-blue-300 hover:bg-blue-100 text-blue-900 shadow-sm" 
                              : "hover:bg-accent"
                          }`}
                        >
                          <CalendarIcon className={`mr-2 h-4 w-4 ${selectedWeekDate ? "text-blue-600" : ""}`} />
                          {selectedWeekDate ? (
                            <span className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
                              <span className="font-semibold text-blue-900">Week {getWeek(selectedWeekDate, { weekStartsOn: 1 })}</span>
                              <span className="text-xs text-blue-700">
                                ({format(startOfWeek(selectedWeekDate, { weekStartsOn: 1 }), 'MMM dd')} - {format(endOfWeek(selectedWeekDate, { weekStartsOn: 1 }), 'MMM dd, yyyy')})
                              </span>
                            </span>
                          ) : (
                            <span>Select a week</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-blue-100">
                          <p className="text-sm font-semibold text-blue-900 text-center">Select a Week</p>
                          <p className="text-xs text-blue-700 text-center mt-1">
                            Click any day to select that week (Monday - Sunday)
                          </p>
                          {selectedWeekDate && (
                            <div className="mt-2 p-2 bg-white rounded-md border border-blue-200">
                              <p className="text-xs font-medium text-center text-blue-900">
                                Currently: Week {getWeek(selectedWeekDate, { weekStartsOn: 1 })}
                              </p>
                            </div>
                          )}
                        </div>
                        <Calendar
                          mode="single"
                          selected={selectedWeekDate}
                          onSelect={setSelectedWeekDate}
                          initialFocus
                          showWeekNumber
                          weekStartsOn={1}
                          modifiers={{
                            weekSelected: selectedWeekDate ? (date) => {
                              const weekStart = startOfWeek(selectedWeekDate, { weekStartsOn: 1 });
                              const currentWeekStart = startOfWeek(date, { weekStartsOn: 1 });
                              return currentWeekStart.getTime() === weekStart.getTime();
                            } : () => false
                          }}
                          modifiersClassNames={{
                            weekSelected: "bg-blue-200 text-blue-900 font-bold hover:bg-blue-300"
                          }}
                        />
                        <div className="p-2 border-t bg-gray-50 flex gap-2 justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToCurrentWeek}
                            className="flex-1 text-xs hover:bg-blue-50"
                          >
                            This Week
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPreviousWeek}
                            className="flex-1 text-xs hover:bg-blue-50"
                          >
                            Last Week
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextWeek}
                      className="px-2 hover:bg-blue-50 hover:border-blue-300"
                      title="Next Week"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToCurrentWeek}
                      className="px-3 hover:bg-blue-50 hover:border-blue-300 text-xs"
                      title="Go to Current Week"
                    >
                      Today
                    </Button>
                  </div>
                  <Button
                    onClick={handleDownloadWeekly}
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-accent transition-colors"
                    disabled={!currentWeek}
                    data-testid="button-download-weekly"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    <span className="hidden xs:inline">Download</span>
                    <span className="xs:hidden">PDF</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        disabled={!currentWeek}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span className="hidden xs:inline">Delete</span>
                        <span className="xs:hidden">Del</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[95vw] max-w-lg mx-2">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Weekly Summary</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                          Are you sure you want to delete the weekly summary for {currentWeek ? `${currentWeek.weekStart} to ${currentWeek.weekEnd}` : 'the selected week'}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteWeekly} className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
                          Delete Summary
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 bg-muted rounded-lg gap-1">
                  <div>
                    <div className="font-medium text-secondary text-sm sm:text-base" data-testid="text-week-total">Week Total</div>
                    <div className="text-xs sm:text-sm text-muted-foreground" data-testid="text-week-orders">
                      {currentWeek ? `${currentWeek.weekStart} to ${currentWeek.weekEnd} • ${currentWeek.orderCount} orders` : "No data"}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-lg sm:text-xl font-bold text-primary" data-testid="text-week-amount">
                      ₹{currentWeek?.totalAmount || "0.00"}
                    </div>
                    <div className="text-xs sm:text-sm text-green-600" data-testid="text-week-change">+0%</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-xs text-green-700 mb-1" data-testid="text-week-gpay">Online Payments Total</div>
                    <div className="text-sm sm:text-base font-bold text-green-800" data-testid="text-week-gpay-amount">
                      ₹{currentWeek?.gpayAmount || "0.00"}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-700 mb-1" data-testid="text-week-cash">Cash Total</div>
                    <div className="text-sm sm:text-base font-bold text-gray-800" data-testid="text-week-cash-amount">
                      ₹{currentWeek?.cashAmount || "0.00"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Summary */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-secondary" data-testid="monthly-summary-title">Monthly Summary</h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousMonth}
                    className="px-2 hover:bg-purple-50 hover:border-purple-300"
                    title="Previous Month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`flex-1 sm:w-auto justify-start text-left font-normal transition-all ${
                          selectedMonthDate 
                            ? "bg-purple-50 border-purple-300 hover:bg-purple-100 text-purple-900 shadow-sm" 
                            : "hover:bg-accent"
                        }`}
                      >
                        <CalendarIcon className={`mr-2 h-4 w-4 ${selectedMonthDate ? "text-purple-600" : ""}`} />
                        {selectedMonthDate ? (
                          <span className="font-semibold text-purple-900">
                            {format(selectedMonthDate, 'MMMM yyyy')}
                          </span>
                        ) : (
                          <span>Select a month</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 month-picker-popover" align="end">
                      <div className="p-3 border-b bg-gradient-to-r from-purple-50 to-purple-100">
                        <p className="text-sm font-semibold text-purple-900 text-center">Select a Month</p>
                        <p className="text-xs text-purple-700 text-center mt-1">
                          Click any day to select that month
                        </p>
                        {selectedMonthDate && (
                          <div className="mt-2 p-2 bg-white rounded-md border border-purple-200">
                            <p className="text-xs font-medium text-center text-purple-900">
                              Currently: {format(selectedMonthDate, 'MMMM yyyy')}
                            </p>
                          </div>
                        )}
                      </div>
                      <Calendar
                        mode="single"
                        selected={selectedMonthDate}
                        onSelect={setSelectedMonthDate}
                        initialFocus
                      />
                      <div className="p-2 border-t bg-gray-50 flex gap-2 justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToCurrentMonth}
                          className="flex-1 text-xs hover:bg-purple-50"
                        >
                          This Month
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPreviousMonth}
                          className="flex-1 text-xs hover:bg-purple-50"
                        >
                          Last Month
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextMonth}
                    className="px-2 hover:bg-purple-50 hover:border-purple-300"
                    title="Next Month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToCurrentMonth}
                    className="px-3 hover:bg-purple-50 hover:border-purple-300 text-xs"
                    title="Go to Current Month"
                  >
                    Today
                  </Button>
                </div>
                <Button
                  onClick={handleDownloadMonthly}
                  className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors w-full sm:w-auto"
                  disabled={!currentMonth}
                  data-testid="button-download-monthly"
                >
                  <Download className="mr-2" size={16} />
                  <span className="hidden xs:inline">Download</span>
                  <span className="xs:hidden">PDF</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 px-2 py-1 text-xs sm:px-3 sm:py-2 sm:text-sm w-full sm:w-auto"
                      disabled={!currentMonth}
                    >
                      <Trash2 className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Delete</span>
                      <span className="xs:hidden">Del</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[95vw] max-w-lg mx-2">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Monthly Summary</AlertDialogTitle>
                      <AlertDialogDescription className="text-sm">
                        Are you sure you want to delete the monthly summary for {currentMonth ? currentMonth.month : 'the current month'}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row">
                      <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteMonthly} className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
                        Delete Summary
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
              <div className="p-3 sm:p-4 invoice-gradient text-white rounded-xl">
                <div className="mb-2 sm:mb-3">
                  <div className="text-xs opacity-90" data-testid="text-month-period">
                    {currentMonth ? new Date(currentMonth.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "No data"}
                  </div>
                  <div className="text-lg sm:text-xl font-bold" data-testid="text-month-total">
                    ₹{currentMonth?.totalAmount || "0.00"}
                  </div>
                </div>
                <div className="text-xs opacity-90" data-testid="text-month-orders">
                  {currentMonth?.orderCount || 0} total orders
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="mb-2 sm:mb-3">
                  <div className="text-xs text-green-700" data-testid="text-month-gpay-label">Online Payments</div>
                  <div className="text-lg sm:text-xl font-bold text-green-800" data-testid="text-month-gpay-total">
                    ₹{currentMonth?.gpayAmount || "0.00"}
                  </div>
                </div>
                <div className="text-xs text-green-600" data-testid="text-month-gpay-percentage">
                  {currentMonth ? ((parseFloat(currentMonth.gpayAmount) / parseFloat(currentMonth.totalAmount)) * 100).toFixed(1) : 0}% of total
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="mb-2 sm:mb-3">
                  <div className="text-xs text-gray-700" data-testid="text-month-cash-label">Cash Payments</div>
                  <div className="text-lg sm:text-xl font-bold text-gray-800" data-testid="text-month-cash-total">
                    ₹{currentMonth?.cashAmount || "0.00"}
                  </div>
                </div>
                <div className="text-xs text-gray-600" data-testid="text-month-cash-percentage">
                  {currentMonth ? ((parseFloat(currentMonth.cashAmount) / parseFloat(currentMonth.totalAmount)) * 100).toFixed(1) : 0}% of total
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Item Sales Analytics */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {/* Sales Table */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col gap-2 mb-3 sm:mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-lg sm:text-xl font-semibold text-secondary">Items Sold Summary</h2>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Button
                      onClick={() => navigate("/menu")}
                      variant="outline"
                      className="px-3 py-2 rounded-lg text-sm hover:bg-secondary hover:text-secondary-foreground transition-colors flex-1 sm:flex-none"
                    >
                      <Menu className="mr-2" size={16} />
                      <span className="hidden xs:inline">View Menu</span>
                      <span className="xs:hidden">Menu</span>
                    </Button>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <BarChart3 className="text-purple-600 text-lg sm:text-xl" />
                    </div>
                  </div>
                </div>
                
                {/* Date Selection and Download for Menu Sales */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`px-3 py-2 text-sm justify-start text-left font-normal date-picker-button ${
                          selectedMenuSalesDate ? "text-foreground" : "text-muted-foreground"
                        }`}
                        data-selected={selectedMenuSalesDate ? "true" : "false"}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedMenuSalesDate ? format(selectedMenuSalesDate, "MMM dd, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 calendar-popover" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedMenuSalesDate}
                        onSelect={setSelectedMenuSalesDate}
                        initialFocus
                        className="rounded-md border"
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Button
                    onClick={handleDownloadMenuSales}
                    className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
                    disabled={!selectedMenuSalesDate}
                    data-testid="button-download-menu-sales"
                  >
                    <Download className="mr-2" size={16} />
                    <span className="hidden xs:inline">Download</span>
                    <span className="xs:hidden">PDF</span>
                  </Button>
                </div>
              </div>

              {menuItemSalesLoading ? (
                <div className="text-center py-4">Loading sales data...</div>
              ) : menuItemSalesError ? (
                <div className="text-center py-4 text-red-600">Error loading sales data</div>
              ) : (
                <div className="space-y-4">
                  {menuItemSales && menuItemSales.length > 0 ? (
                    <div className="max-h-48 sm:max-h-64 overflow-y-auto">
                      {/* Mobile Card Layout */}
                      <div className="block sm:hidden space-y-1">
                        {menuItemSales.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                            <span className="font-medium text-sm truncate pr-2">{item.name}</span>
                            <span className="font-bold text-purple-600 text-sm">{item.totalSold || 0}</span>
                          </div>
                        ))}
                      </div>
                      {/* Desktop Table Layout */}
                      <div className="hidden sm:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Menu Item</TableHead>
                              <TableHead className="text-right">Sales Count</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {menuItemSales.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-right font-bold text-purple-600">
                                  {item.totalSold || 0}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No sales data available for today
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sales Chart */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-secondary">Individual Menu Item Sales</h2>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Select value={chartType} onValueChange={(value: "bar" | "pie") => setChartType(value)}>
                    <SelectTrigger className="w-28 sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-green-600 text-lg sm:text-xl" />
                  </div>
                </div>
              </div>

              {menuItemSalesLoading ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading sales data...</p>
                </div>
              ) : menuItemSalesError ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-600 text-2xl">⚠️</span>
                  </div>
                  <p className="text-red-600 font-medium">Error loading sales data</p>
                  <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page</p>
                </div>
              ) : (
                <div className="h-48 sm:h-64 lg:h-80">
                  {chartData && chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === "bar" ? (
                        <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            fontSize={10}
                            interval={0}
                          />
                          <YAxis fontSize={11} />
                          <Tooltip
                            formatter={(value, name, props) => [
                              `${value} sold`,
                              props.payload.fullName
                            ]}
                            labelFormatter={(label) => `Item: ${label}`}
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #ccc',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                              fontSize: '12px'
                            }}
                          />
                          <Bar
                            dataKey="count"
                            fill="#8884d8"
                            radius={[3, 3, 0, 0]}
                          />
                        </BarChart>
                      ) : (
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, count, percent }) => `${count}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name, props) => [
                              `${value} sold`,
                              props.payload.fullName
                            ]}
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #ccc',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                              fontSize: '12px'
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                      <p className="text-base sm:text-lg font-medium">No sales data available</p>
                      <p className="text-xs sm:text-sm mt-2">Start selling items to see the visualization</p>
                    </div>
                  )}
                </div>
              )}

              {/* Sales Summary */}
              {chartData && chartData.length > 0 && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-primary">{chartData.length}</p>
                      <p className="text-xs text-muted-foreground">Items Sold</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-green-600">
                        {chartData.reduce((sum, item) => sum + item.count, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Quantity</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-blue-600">
                        ₹{chartData.reduce((sum, item) => sum + item.revenue, 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Revenue</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-purple-600">
                        ₹{chartData.length > 0 ? (chartData.reduce((sum, item) => sum + item.revenue, 0) / chartData.reduce((sum, item) => sum + item.count, 0)).toFixed(2) : '0.00'}
                      </p>
                      <p className="text-xs text-muted-foreground">Avg. Price</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

       
        {/* Powered by Innowara */}
        
        
        

        <footer className="mt-4 sm:mt-6 border-t border-border pt-2 sm:pt-3 text-center text-xs text-muted-foreground">
           <h3>©️ 2025 - 2026 Inwora.in</h3>
        </footer>
      </div>
    </div>
  );
}
