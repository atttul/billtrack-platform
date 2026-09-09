export interface DashboardSummary {
  monthlyTotal: number;
  upcomingPaymentsCount: number;
  activeSubscriptions: number;
  nextPayment: {
    billId: string;
    name: string;
    amount: number;
    currency: string;
    dueDate: string;
    category?: {
      name: string;
      icon: string;
      color: string;
    };
  } | null;
  categorySummary: Array<{
    categoryId: string;
    categoryName: string;
    icon: string;
    color: string;
    monthlySpend: number;
  }>;
  upcomingPayments: Array<{
    id: string;
    billId: string;
    name: string;
    amount: number;
    currency: string;
    dueDate: string;
    status: string;
  }>;
}
