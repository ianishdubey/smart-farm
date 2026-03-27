import { useEffect, useMemo, useState } from 'react';
import { Farm, Expense, Payment } from '../../lib/supabase';
import { DollarSign, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  farm: Farm | null;
}

type Tab = 'overview' | 'expenses' | 'revenue';
type InsightSeverity = 'positive' | 'warning' | 'critical';

const SEASON_OPTIONS = ['Kharif', 'Rabi', 'Zaid', 'Other'] as const;
const SEASON_ORDER: Record<string, number> = {
  Kharif: 1,
  Rabi: 2,
  Zaid: 3,
  Other: 4,
};

const DEFAULT_CROP_OPTIONS = [
  'Wheat',
  'Rice',
  'Maize',
  'Cotton',
  'Sugarcane',
  'Soybean',
  'Potato',
  'Onion',
  'Tomato',
];

const CROP_NOT_LINKED_OPTION = 'Not Linked';
const CROP_OTHER_OPTION = 'Other';

interface NormalizedExpense extends Expense {
  normalizedSeason: string;
  normalizedSeasonYear: number;
  periodKey: string;
  monthKey: string;
  monthLabel: string;
  parsedDate: Date;
}

interface NormalizedPayment extends Payment {
  normalizedSeason: string;
  normalizedSeasonYear: number;
  periodKey: string;
  monthKey: string;
  monthLabel: string;
  parsedDate: Date;
}

interface PeriodSummary {
  periodKey: string;
  season: string;
  seasonYear: number;
  revenue: number;
  expenses: number;
  profit: number;
  deltaFromPrevious: number | null;
}

interface CropPeriodSummary {
  crop: string;
  periodKey: string;
  season: string;
  seasonYear: number;
  revenue: number;
  expenses: number;
  profit: number;
  deltaFromPrevious: number | null;
}

interface MonthlySummary {
  monthKey: string;
  monthLabel: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface Insight {
  title: string;
  detail: string;
  severity: InsightSeverity;
}

interface SameCropComparisonRow {
  crop: string;
  currentSeason: string;
  currentSeasonYear: number;
  currentRevenue: number;
  currentExpenses: number;
  currentProfit: number;
  previousSeason: string | null;
  previousSeasonYear: number | null;
  previousRevenue: number | null;
  previousExpenses: number | null;
  previousProfit: number | null;
  changeFromPrevious: number | null;
}

function safeDate(dateValue: string | null | undefined): Date {
  if (!dateValue) return new Date();

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return new Date();

  return parsedDate;
}

function inferSeason(date: Date): string {
  const month = date.getMonth() + 1;

  if (month >= 6 && month <= 10) return 'Kharif';
  if (month === 4 || month === 5) return 'Zaid';

  return 'Rabi';
}

function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0];
}

function toCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function comparePeriods(
  firstSeason: string,
  firstYear: number,
  secondSeason: string,
  secondYear: number
): number {
  if (firstYear !== secondYear) {
    return firstYear - secondYear;
  }

  return (SEASON_ORDER[firstSeason] ?? 99) - (SEASON_ORDER[secondSeason] ?? 99);
}

function getDeltaLabel(delta: number | null): string {
  if (delta === null) return '-';

  const sign = delta > 0 ? '+' : '';
  return `${sign}${toCurrency(delta)}`;
}

function getPeriodLabel(
  season: string | null | undefined,
  seasonYear: number | null | undefined,
  dateValue: string | null | undefined
): string {
  const parsedDate = safeDate(dateValue);
  const finalSeason = season || inferSeason(parsedDate);
  const finalSeasonYear = seasonYear ?? parsedDate.getFullYear();

  return `${finalSeason} ${finalSeasonYear}`;
}

function normalizeCropName(value: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) return '';

  return trimmedValue
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function cropKey(value: string): string {
  return value.trim().toLowerCase();
}

function cropMatchesFilter(value: string | null | undefined, selectedCrop: string): boolean {
  if (selectedCrop === 'All') return true;
  if (!value) return false;
  return cropKey(value) === cropKey(selectedCrop);
}

function resolveCropSelection(cropOption: string, customCropName: string): string {
  if (cropOption === CROP_OTHER_OPTION) {
    return normalizeCropName(customCropName);
  }

  if (cropOption === CROP_NOT_LINKED_OPTION) {
    return '';
  }

  return normalizeCropName(cropOption);
}

function normalizeFormSeason(season: string): string {
  const matchedSeason = SEASON_OPTIONS.find(
    (seasonOption) => seasonOption.toLowerCase() === season.toLowerCase()
  );
  return matchedSeason || 'Other';
}

const insightStyles: Record<InsightSeverity, string> = {
  positive: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  critical: 'border-red-200 bg-red-50 text-red-800',
};

export default function FinancialAnalytics({ farm }: Props) {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showRevenueForm, setShowRevenueForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  const [expenseForm, setExpenseForm] = useState(() => {
    const now = new Date();
    return {
      category: 'Seeds',
      amount: '',
      description: '',
      cropOption: CROP_NOT_LINKED_OPTION,
      customCropName: '',
      expenseDate: toDateInputValue(now),
      season: inferSeason(now),
      seasonYear: String(now.getFullYear()),
    };
  });

  const [revenueForm, setRevenueForm] = useState(() => {
    const now = new Date();
    return {
      cropOption: DEFAULT_CROP_OPTIONS[0],
      customCropName: '',
      quantity: '',
      buyerName: '',
      amountReceived: '',
      pendingAmount: '',
      saleDate: toDateInputValue(now),
      season: inferSeason(now),
      seasonYear: String(now.getFullYear()),
    };
  });

  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<string>('All');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('All');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('All');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (farm) {
      fetchFinancialData();
    }
  }, [farm]);

  async function fetchFinancialData() {
    if (!farm) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('auth_token');

      if (!token) return;

      const [expensesRes, paymentsRes] = await Promise.all([
        fetch(`${apiUrl}/expenses/farm/${farm.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/payments/farm/${farm.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const expensesData = expensesRes.ok ? await expensesRes.json() : [];
      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : [];

      setExpenses(expensesData || []);
      setPayments(paymentsData || []);
    } catch (fetchError) {
      console.error('Error fetching financial data:', fetchError);
    }
  }

  function resetExpenseForm() {
    const now = new Date();
    setExpenseForm({
      category: 'Seeds',
      amount: '',
      description: '',
      cropOption: CROP_NOT_LINKED_OPTION,
      customCropName: '',
      expenseDate: toDateInputValue(now),
      season: inferSeason(now),
      seasonYear: String(now.getFullYear()),
    });
  }

  function resetRevenueForm() {
    const now = new Date();
    setRevenueForm({
      cropOption: DEFAULT_CROP_OPTIONS[0],
      customCropName: '',
      quantity: '',
      buyerName: '',
      amountReceived: '',
      pendingAmount: '',
      saleDate: toDateInputValue(now),
      season: inferSeason(now),
      seasonYear: String(now.getFullYear()),
    });
  }

  function startEditingExpense(expense: NormalizedExpense) {
    const normalizedCrop = normalizeCropName(expense.crop_related || '');
    const matchingCropOption = cropFormOptions.find(
      (crop) => cropKey(crop) === cropKey(normalizedCrop)
    );

    setExpenseForm({
      category: expense.category || 'Seeds',
      amount: String(expense.amount ?? ''),
      description: expense.description || '',
      cropOption: !normalizedCrop
        ? CROP_NOT_LINKED_OPTION
        : matchingCropOption || CROP_OTHER_OPTION,
      customCropName:
        normalizedCrop && !matchingCropOption ? normalizedCrop : '',
      expenseDate: toDateInputValue(expense.parsedDate),
      season: normalizeFormSeason(expense.normalizedSeason),
      seasonYear: String(expense.normalizedSeasonYear),
    });

    setEditingExpenseId(expense.id);
    setShowExpenseForm(true);
    setError('');
    setSuccess('');
  }

  function startEditingPayment(payment: NormalizedPayment) {
    const normalizedCrop = normalizeCropName(payment.crop_sold || '');
    const matchingCropOption = cropFormOptions.find(
      (crop) => cropKey(crop) === cropKey(normalizedCrop)
    );

    setRevenueForm({
      cropOption: !normalizedCrop
        ? DEFAULT_CROP_OPTIONS[0]
        : matchingCropOption || CROP_OTHER_OPTION,
      customCropName:
        normalizedCrop && !matchingCropOption ? normalizedCrop : '',
      quantity: String(payment.quantity ?? ''),
      buyerName: payment.buyer_name || '',
      amountReceived: String(payment.amount_received ?? ''),
      pendingAmount: String(payment.pending_amount ?? 0),
      saleDate: toDateInputValue(payment.parsedDate),
      season: normalizeFormSeason(payment.normalizedSeason),
      seasonYear: String(payment.normalizedSeasonYear),
    });

    setEditingPaymentId(payment.id);
    setShowRevenueForm(true);
    setError('');
    setSuccess('');
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();

    if (!farm || !user) {
      setError('Farm or user not found');
      return;
    }

    if (
      !expenseForm.amount ||
      !expenseForm.expenseDate ||
      !expenseForm.season ||
      !expenseForm.seasonYear
    ) {
      setError('Please fill amount, date, season, and season year');
      return;
    }

    const parsedAmount = Number.parseFloat(expenseForm.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Expense amount should be greater than 0');
      return;
    }

    const parsedSeasonYear = Number.parseInt(expenseForm.seasonYear, 10);
    if (!Number.isInteger(parsedSeasonYear) || parsedSeasonYear < 2000 || parsedSeasonYear > 2100) {
      setError('Please enter a valid season year (2000-2100)');
      return;
    }

    const resolvedExpenseCrop = resolveCropSelection(
      expenseForm.cropOption,
      expenseForm.customCropName
    );
    if (expenseForm.cropOption === CROP_OTHER_OPTION && !resolvedExpenseCrop) {
      setError('Please enter crop name for Other option');
      return;
    }

    try {
      setError('');
      setSuccess('');

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('auth_token');

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const isEditingExpense = editingExpenseId !== null;
      const response = await fetch(
        isEditingExpense ? `${apiUrl}/expenses/${editingExpenseId}` : `${apiUrl}/expenses`,
        {
        method: isEditingExpense ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          farm_id: farm.id,
          farmer_id: user.id,
          category: expenseForm.category,
          amount: parsedAmount,
          description: expenseForm.description,
          crop_related: resolvedExpenseCrop || null,
          expense_date: expenseForm.expenseDate,
          season: expenseForm.season,
          season_year: parsedSeasonYear,
        }),
      }
      );

      if (response.ok) {
        resetExpenseForm();
        setEditingExpenseId(null);
        setShowExpenseForm(false);
        setSuccess(
          editingExpenseId ? 'Expense updated successfully.' : 'Expense added successfully.'
        );
        setTimeout(() => setSuccess(''), 3000);
        fetchFinancialData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save expense');
      }
    } catch (createError) {
      console.error('Error adding expense:', createError);
      setError('Error adding expense. Please try again.');
    }
  }

  async function handleAddRevenue(e: React.FormEvent) {
    e.preventDefault();

    if (!farm || !user) {
      setError('Farm or user not found');
      return;
    }

    if (
      !revenueForm.quantity ||
      !revenueForm.amountReceived ||
      !revenueForm.saleDate ||
      !revenueForm.season ||
      !revenueForm.seasonYear
    ) {
      setError('Please fill quantity, received amount, date, season, and season year');
      return;
    }

    const parsedQuantity = Number.parseFloat(revenueForm.quantity);
    const parsedAmountReceived = Number.parseFloat(revenueForm.amountReceived);
    const parsedPendingAmount = Number.parseFloat(revenueForm.pendingAmount || '0');
    const parsedSeasonYear = Number.parseInt(revenueForm.seasonYear, 10);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError('Quantity should be greater than 0');
      return;
    }

    if (!Number.isFinite(parsedAmountReceived) || parsedAmountReceived < 0) {
      setError('Amount received must be 0 or greater');
      return;
    }

    if (!Number.isFinite(parsedPendingAmount) || parsedPendingAmount < 0) {
      setError('Pending amount must be 0 or greater');
      return;
    }

    if (!Number.isInteger(parsedSeasonYear) || parsedSeasonYear < 2000 || parsedSeasonYear > 2100) {
      setError('Please enter a valid season year (2000-2100)');
      return;
    }

    const resolvedRevenueCrop = resolveCropSelection(
      revenueForm.cropOption,
      revenueForm.customCropName
    );
    if (!resolvedRevenueCrop) {
      setError('Please select crop name. If Other is selected, enter crop name.');
      return;
    }

    try {
      setError('');
      setSuccess('');

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('auth_token');

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const paymentStatus =
        parsedPendingAmount > 0
          ? parsedAmountReceived > 0
            ? 'Partial'
            : 'Pending'
          : 'Paid';

      const isEditingPayment = editingPaymentId !== null;
      const response = await fetch(
        isEditingPayment ? `${apiUrl}/payments/${editingPaymentId}` : `${apiUrl}/payments`,
        {
        method: isEditingPayment ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          farm_id: farm.id,
          crop_sold: resolvedRevenueCrop,
          quantity: parsedQuantity,
          buyer_name: revenueForm.buyerName,
          amount_received: parsedAmountReceived,
          pending_amount: parsedPendingAmount,
          payment_status: paymentStatus,
          sale_date: revenueForm.saleDate,
          season: revenueForm.season,
          season_year: parsedSeasonYear,
        }),
      }
      );

      if (response.ok) {
        resetRevenueForm();
        setEditingPaymentId(null);
        setShowRevenueForm(false);
        setSuccess(
          editingPaymentId ? 'Revenue updated successfully.' : 'Revenue recorded successfully.'
        );
        setTimeout(() => setSuccess(''), 3000);
        fetchFinancialData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save revenue');
      }
    } catch (createError) {
      console.error('Error adding revenue:', createError);
      setError('Error adding revenue. Please try again.');
    }
  }

  const normalizedExpenses = useMemo<NormalizedExpense[]>(() => {
    return expenses.map((expense) => {
      const parsedDate = safeDate(expense.expense_date);
      const normalizedSeason = expense.season || inferSeason(parsedDate);
      const normalizedSeasonYear = expense.season_year ?? parsedDate.getFullYear();
      const monthKey = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = parsedDate.toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      });

      return {
        ...expense,
        normalizedSeason,
        normalizedSeasonYear,
        periodKey: `${normalizedSeason}-${normalizedSeasonYear}`,
        monthKey,
        monthLabel,
        parsedDate,
      };
    });
  }, [expenses]);

  const normalizedPayments = useMemo<NormalizedPayment[]>(() => {
    return payments.map((payment) => {
      const parsedDate = safeDate(payment.sale_date);
      const normalizedSeason = payment.season || inferSeason(parsedDate);
      const normalizedSeasonYear = payment.season_year ?? parsedDate.getFullYear();
      const monthKey = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = parsedDate.toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      });

      return {
        ...payment,
        normalizedSeason,
        normalizedSeasonYear,
        periodKey: `${normalizedSeason}-${normalizedSeasonYear}`,
        monthKey,
        monthLabel,
        parsedDate,
      };
    });
  }, [payments]);

  const seasonFilterOptions = useMemo(() => {
    const seasonMap = new Map<string, string>();
    SEASON_OPTIONS.forEach((season) => seasonMap.set(season.toLowerCase(), season));

    normalizedExpenses.forEach((expense) => {
      const season = expense.normalizedSeason?.trim();
      if (season) {
        seasonMap.set(season.toLowerCase(), season);
      }
    });

    normalizedPayments.forEach((payment) => {
      const season = payment.normalizedSeason?.trim();
      if (season) {
        seasonMap.set(season.toLowerCase(), season);
      }
    });

    return Array.from(seasonMap.values()).sort(
      (firstSeason, secondSeason) =>
        (SEASON_ORDER[firstSeason] ?? 99) - (SEASON_ORDER[secondSeason] ?? 99)
    );
  }, [normalizedExpenses, normalizedPayments]);

  const userCropOptions = useMemo(() => {
    const cropMap = new Map<string, string>();

    normalizedPayments.forEach((payment) => {
      const cropName = normalizeCropName(payment.crop_sold || '');
      if (
        cropName &&
        cropName !== CROP_OTHER_OPTION &&
        cropName !== CROP_NOT_LINKED_OPTION
      ) {
        cropMap.set(cropKey(cropName), cropName);
      }
    });

    normalizedExpenses.forEach((expense) => {
      const cropName = normalizeCropName(expense.crop_related || '');
      if (
        cropName &&
        cropName !== CROP_OTHER_OPTION &&
        cropName !== CROP_NOT_LINKED_OPTION
      ) {
        cropMap.set(cropKey(cropName), cropName);
      }
    });

    return Array.from(cropMap.values()).sort((firstCrop, secondCrop) =>
      firstCrop.localeCompare(secondCrop)
    );
  }, [normalizedExpenses, normalizedPayments]);

  const cropFormOptions = useMemo(() => {
    const cropMap = new Map<string, string>();

    DEFAULT_CROP_OPTIONS.forEach((crop) => {
      cropMap.set(cropKey(crop), crop);
    });

    userCropOptions.forEach((crop) => {
      if (!cropMap.has(cropKey(crop))) {
        cropMap.set(cropKey(crop), crop);
      }
    });

    return Array.from(cropMap.values());
  }, [userCropOptions]);

  const cropFilterOptions = useMemo(() => userCropOptions, [userCropOptions]);

  const yearFilterOptions = useMemo(() => {
    const yearSet = new Set<number>();
    normalizedExpenses.forEach((expense) => yearSet.add(expense.normalizedSeasonYear));
    normalizedPayments.forEach((payment) => yearSet.add(payment.normalizedSeasonYear));

    return Array.from(yearSet).sort((firstYear, secondYear) => secondYear - firstYear);
  }, [normalizedExpenses, normalizedPayments]);

  const filteredExpenses = useMemo(() => {
    return normalizedExpenses.filter((expense) => {
      const seasonMatches =
        selectedSeasonFilter === 'All' || expense.normalizedSeason === selectedSeasonFilter;
      const yearMatches =
        selectedYearFilter === 'All' || String(expense.normalizedSeasonYear) === selectedYearFilter;
      const cropMatches = cropMatchesFilter(expense.crop_related, selectedCropFilter);

      return seasonMatches && yearMatches && cropMatches;
    });
  }, [normalizedExpenses, selectedSeasonFilter, selectedYearFilter, selectedCropFilter]);

  const filteredPayments = useMemo(() => {
    return normalizedPayments.filter((payment) => {
      const seasonMatches =
        selectedSeasonFilter === 'All' || payment.normalizedSeason === selectedSeasonFilter;
      const yearMatches =
        selectedYearFilter === 'All' || String(payment.normalizedSeasonYear) === selectedYearFilter;
      const cropMatches = cropMatchesFilter(payment.crop_sold, selectedCropFilter);

      return seasonMatches && yearMatches && cropMatches;
    });
  }, [normalizedPayments, selectedSeasonFilter, selectedYearFilter, selectedCropFilter]);

  const expensesForList = useMemo(() => {
    return [...normalizedExpenses].sort(
      (firstExpense, secondExpense) => secondExpense.parsedDate.getTime() - firstExpense.parsedDate.getTime()
    );
  }, [normalizedExpenses]);

  const paymentsForList = useMemo(() => {
    return [...normalizedPayments].sort(
      (firstPayment, secondPayment) => secondPayment.parsedDate.getTime() - firstPayment.parsedDate.getTime()
    );
  }, [normalizedPayments]);

  const overallTotalExpenses = normalizedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const overallTotalRevenue = normalizedPayments.reduce((sum, payment) => sum + payment.amount_received, 0);
  const overallTotalPending = normalizedPayments.reduce((sum, payment) => sum + payment.pending_amount, 0);
  const overallProfit = overallTotalRevenue - overallTotalExpenses;

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.amount_received, 0);
  const totalPending = filteredPayments.reduce((sum, payment) => sum + payment.pending_amount, 0);
  const profit = totalRevenue - totalExpenses;

  const expensesByCategory = useMemo(() => {
    return filteredExpenses.reduce((accumulator, expense) => {
      accumulator[expense.category] = (accumulator[expense.category] || 0) + expense.amount;
      return accumulator;
    }, {} as Record<string, number>);
  }, [filteredExpenses]);

  const expenseCategoryEntries = useMemo(() => {
    return Object.entries(expensesByCategory).sort((firstEntry, secondEntry) => secondEntry[1] - firstEntry[1]);
  }, [expensesByCategory]);

  const monthlySummary = useMemo<MonthlySummary[]>(() => {
    const summaryMap = new Map<string, MonthlySummary>();

    filteredExpenses.forEach((expense) => {
      const existingSummary = summaryMap.get(expense.monthKey) || {
        monthKey: expense.monthKey,
        monthLabel: expense.monthLabel,
        revenue: 0,
        expenses: 0,
        profit: 0,
      };
      existingSummary.expenses += expense.amount;
      existingSummary.profit = existingSummary.revenue - existingSummary.expenses;
      summaryMap.set(expense.monthKey, existingSummary);
    });

    filteredPayments.forEach((payment) => {
      const existingSummary = summaryMap.get(payment.monthKey) || {
        monthKey: payment.monthKey,
        monthLabel: payment.monthLabel,
        revenue: 0,
        expenses: 0,
        profit: 0,
      };
      existingSummary.revenue += payment.amount_received;
      existingSummary.profit = existingSummary.revenue - existingSummary.expenses;
      summaryMap.set(payment.monthKey, existingSummary);
    });

    return Array.from(summaryMap.values())
      .map((entry) => ({
        ...entry,
        profit: entry.revenue - entry.expenses,
      }))
      .sort((firstEntry, secondEntry) => firstEntry.monthKey.localeCompare(secondEntry.monthKey));
  }, [filteredExpenses, filteredPayments]);

  const periodSummary = useMemo<PeriodSummary[]>(() => {
    const summaryMap = new Map<string, Omit<PeriodSummary, 'deltaFromPrevious' | 'profit'>>();

    filteredExpenses.forEach((expense) => {
      const existingSummary = summaryMap.get(expense.periodKey) || {
        periodKey: expense.periodKey,
        season: expense.normalizedSeason,
        seasonYear: expense.normalizedSeasonYear,
        revenue: 0,
        expenses: 0,
      };
      existingSummary.expenses += expense.amount;
      summaryMap.set(expense.periodKey, existingSummary);
    });

    filteredPayments.forEach((payment) => {
      const existingSummary = summaryMap.get(payment.periodKey) || {
        periodKey: payment.periodKey,
        season: payment.normalizedSeason,
        seasonYear: payment.normalizedSeasonYear,
        revenue: 0,
        expenses: 0,
      };
      existingSummary.revenue += payment.amount_received;
      summaryMap.set(payment.periodKey, existingSummary);
    });

    const sortedPeriods = Array.from(summaryMap.values())
      .map((entry) => ({
        ...entry,
        profit: entry.revenue - entry.expenses,
      }))
      .sort((firstEntry, secondEntry) =>
        comparePeriods(
          firstEntry.season,
          firstEntry.seasonYear,
          secondEntry.season,
          secondEntry.seasonYear
        )
      );

    return sortedPeriods.map((entry, index) => {
      const previousEntry = index > 0 ? sortedPeriods[index - 1] : null;
      return {
        ...entry,
        deltaFromPrevious: previousEntry ? entry.profit - previousEntry.profit : null,
      };
    });
  }, [filteredExpenses, filteredPayments]);

  const cropPeriodSummary = useMemo<CropPeriodSummary[]>(() => {
    const summaryMap = new Map<string, CropPeriodSummary>();

    filteredPayments.forEach((payment) => {
      const cropName = normalizeCropName(payment.crop_sold || '');
      if (!cropName) return;

      const cropKey = cropName.toLowerCase();
      const summaryKey = `${cropKey}-${payment.periodKey}`;
      const existingSummary = summaryMap.get(summaryKey) || {
        crop: cropName,
        periodKey: payment.periodKey,
        season: payment.normalizedSeason,
        seasonYear: payment.normalizedSeasonYear,
        revenue: 0,
        expenses: 0,
        profit: 0,
        deltaFromPrevious: null,
      };

      existingSummary.revenue += payment.amount_received;
      existingSummary.profit = existingSummary.revenue - existingSummary.expenses;
      summaryMap.set(summaryKey, existingSummary);
    });

    filteredExpenses.forEach((expense) => {
      const cropName = normalizeCropName(expense.crop_related || '');
      if (!cropName) return;

      const cropKey = cropName.toLowerCase();
      const summaryKey = `${cropKey}-${expense.periodKey}`;
      const existingSummary = summaryMap.get(summaryKey) || {
        crop: cropName,
        periodKey: expense.periodKey,
        season: expense.normalizedSeason,
        seasonYear: expense.normalizedSeasonYear,
        revenue: 0,
        expenses: 0,
        profit: 0,
        deltaFromPrevious: null,
      };

      existingSummary.expenses += expense.amount;
      existingSummary.profit = existingSummary.revenue - existingSummary.expenses;
      summaryMap.set(summaryKey, existingSummary);
    });

    const groupedByCrop = new Map<string, CropPeriodSummary[]>();
    summaryMap.forEach((entry) => {
      const cropKey = entry.crop.toLowerCase();
      const existingGroup = groupedByCrop.get(cropKey) || [];
      existingGroup.push({ ...entry });
      groupedByCrop.set(cropKey, existingGroup);
    });

    const rowsWithDelta: CropPeriodSummary[] = [];
    groupedByCrop.forEach((entries) => {
      entries.sort((firstEntry, secondEntry) =>
        comparePeriods(
          firstEntry.season,
          firstEntry.seasonYear,
          secondEntry.season,
          secondEntry.seasonYear
        )
      );

      entries.forEach((entry, index) => {
        const previousEntry = index > 0 ? entries[index - 1] : null;
        rowsWithDelta.push({
          ...entry,
          profit: entry.revenue - entry.expenses,
          deltaFromPrevious: previousEntry
            ? entry.revenue - entry.expenses - (previousEntry.revenue - previousEntry.expenses)
            : null,
        });
      });
    });

    return rowsWithDelta.sort((firstEntry, secondEntry) => {
      const periodOrder = comparePeriods(
        secondEntry.season,
        secondEntry.seasonYear,
        firstEntry.season,
        firstEntry.seasonYear
      );
      if (periodOrder !== 0) return periodOrder;
      return secondEntry.profit - firstEntry.profit;
    });
  }, [filteredExpenses, filteredPayments]);

  const sameCropComparisonRows = useMemo<SameCropComparisonRow[]>(() => {
    const groupedByCrop = new Map<string, CropPeriodSummary[]>();

    cropPeriodSummary.forEach((entry) => {
      const key = cropKey(entry.crop);
      const existingEntries = groupedByCrop.get(key) || [];
      existingEntries.push(entry);
      groupedByCrop.set(key, existingEntries);
    });

    const rows: SameCropComparisonRow[] = [];
    groupedByCrop.forEach((entries) => {
      entries.sort((firstEntry, secondEntry) =>
        comparePeriods(
          firstEntry.season,
          firstEntry.seasonYear,
          secondEntry.season,
          secondEntry.seasonYear
        )
      );

      entries.forEach((entry, index) => {
        const previousEntry = index > 0 ? entries[index - 1] : null;
        rows.push({
          crop: entry.crop,
          currentSeason: entry.season,
          currentSeasonYear: entry.seasonYear,
          currentRevenue: entry.revenue,
          currentExpenses: entry.expenses,
          currentProfit: entry.profit,
          previousSeason: previousEntry?.season ?? null,
          previousSeasonYear: previousEntry?.seasonYear ?? null,
          previousRevenue: previousEntry?.revenue ?? null,
          previousExpenses: previousEntry?.expenses ?? null,
          previousProfit: previousEntry?.profit ?? null,
          changeFromPrevious:
            previousEntry !== null ? entry.profit - previousEntry.profit : null,
        });
      });
    });

    return rows.sort((firstRow, secondRow) => {
      const periodOrder = comparePeriods(
        secondRow.currentSeason,
        secondRow.currentSeasonYear,
        firstRow.currentSeason,
        firstRow.currentSeasonYear
      );
      if (periodOrder !== 0) return periodOrder;
      return secondRow.currentProfit - firstRow.currentProfit;
    });
  }, [cropPeriodSummary]);

  const recommendations = useMemo<Insight[]>(() => {
    const generatedRecommendations: Insight[] = [];

    if (filteredExpenses.length === 0 && filteredPayments.length === 0) {
      return [
        {
          title: 'Start with dated seasonal entries',
          detail:
            'Add expense and revenue records with date, season, and year so monthly and seasonal comparison can be generated automatically.',
          severity: 'warning',
        },
      ];
    }

    if (profit < 0) {
      generatedRecommendations.push({
        title: 'Current period is running at a loss',
        detail:
          'Review the highest-cost categories and delay non-essential purchases until revenue stabilizes in the next sale cycle.',
        severity: 'critical',
      });
    } else {
      generatedRecommendations.push({
        title: 'Period profitability is positive',
        detail:
          'Use part of this profit to lock input prices early for the next season and negotiate bulk discounts to protect margins.',
        severity: 'positive',
      });
    }

    const topCategory = expenseCategoryEntries[0];
    if (topCategory && totalExpenses > 0) {
      const topCategoryShare = (topCategory[1] / totalExpenses) * 100;
      if (topCategoryShare >= 40) {
        generatedRecommendations.push({
          title: `${topCategory[0]} is consuming ${topCategoryShare.toFixed(0)}% of expenses`,
          detail:
            'Benchmark supplier rates and explore group procurement for this category to cut input costs without reducing output quality.',
          severity: 'warning',
        });
      }
    }

    if (totalPending > 0 && totalRevenue > 0 && totalPending / totalRevenue >= 0.2) {
      generatedRecommendations.push({
        title: 'Pending payments are high',
        detail:
          'Introduce milestone collections (advance + delivery + final payment) to improve cash flow and reduce delayed receivables.',
        severity: 'warning',
      });
    }

    const worstCrop = [...cropPeriodSummary]
      .filter((entry) => entry.profit < 0)
      .sort((firstEntry, secondEntry) => firstEntry.profit - secondEntry.profit)[0];
    if (worstCrop) {
      generatedRecommendations.push({
        title: `${worstCrop.crop} shows negative margin in ${worstCrop.season} ${worstCrop.seasonYear}`,
        detail:
          'Compare this crop against alternatives with stronger recent margins and reduce exposure if losses repeat for consecutive seasons.',
        severity: 'critical',
      });
    }

    const decliningCrop = cropPeriodSummary.find(
      (entry) => entry.deltaFromPrevious !== null && entry.deltaFromPrevious < 0
    );
    if (decliningCrop && decliningCrop.deltaFromPrevious !== null) {
      generatedRecommendations.push({
        title: `${decliningCrop.crop} margin declined vs previous period`,
        detail:
          `Profit changed by ${toCurrency(decliningCrop.deltaFromPrevious)}. Re-check yield, market timing, and input efficiency for this crop.`,
        severity: 'warning',
      });
    }

    const uncategorizedExpenseValue = filteredExpenses
      .filter((expense) => !expense.crop_related || !expense.crop_related.trim())
      .reduce((sum, expense) => sum + expense.amount, 0);

    if (uncategorizedExpenseValue > 0 && totalExpenses > 0 && uncategorizedExpenseValue / totalExpenses >= 0.3) {
      generatedRecommendations.push({
        title: 'Many expenses are not tied to a crop',
        detail:
          'Tag expenses with crop name while recording costs. This improves season-wise crop profitability comparison and decision quality.',
        severity: 'warning',
      });
    }

    return generatedRecommendations.slice(0, 5);
  }, [
    filteredExpenses,
    filteredPayments,
    profit,
    expenseCategoryEntries,
    totalExpenses,
    totalPending,
    totalRevenue,
    cropPeriodSummary,
  ]);

  const latestPeriod = periodSummary.length > 0 ? periodSummary[periodSummary.length - 1] : null;
  const previousPeriod = periodSummary.length > 1 ? periodSummary[periodSummary.length - 2] : null;

  const filterLabel =
    `${selectedSeasonFilter === 'All' ? 'All Seasons' : selectedSeasonFilter} | ` +
    `${selectedYearFilter === 'All' ? 'All Years' : selectedYearFilter} | ` +
    `${selectedCropFilter === 'All' ? 'All Crops' : selectedCropFilter}`;

  if (!farm) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-gray-600">Please set up your farm profile to track finances.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Financial Analytics</h2>
          <p className="text-gray-600">Track monthly, seasonal, and yearly profitability</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{toCurrency(overallTotalRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">Overall farm total</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{toCurrency(overallTotalExpenses)}</p>
          <p className="text-xs text-gray-500 mt-1">Overall farm total</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Net Profit</p>
            <DollarSign className={`h-5 w-5 ${overallProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <p className={`text-2xl font-bold ${overallProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {toCurrency(overallProfit)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Overall farm total</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Pending Payments</p>
            <DollarSign className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{toCurrency(overallTotalPending)}</p>
          <p className="text-xs text-gray-500 mt-1">Overall farm total</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'overview'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'expenses'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'revenue'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Revenue
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Analysis Scope</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select
                    value={selectedSeasonFilter}
                    onChange={(event) => setSelectedSeasonFilter(event.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="All">All Seasons</option>
                    {seasonFilterOptions.map((season) => (
                      <option key={season} value={season}>
                        {season}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedYearFilter}
                    onChange={(event) => setSelectedYearFilter(event.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="All">All Years</option>
                    {yearFilterOptions.map((year) => (
                      <option key={year} value={String(year)}>
                        {year}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedCropFilter}
                    onChange={(event) => setSelectedCropFilter(event.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="All">All Crops</option>
                    {cropFilterOptions.map((crop) => (
                      <option key={crop} value={crop}>
                        {crop}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSeasonFilter('All');
                      setSelectedYearFilter('All');
                      setSelectedCropFilter('All');
                    }}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-medium"
                  >
                    Reset Filters
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-3">Showing: {filterLabel}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Top cards show overall farm totals. Tables below follow the selected analysis scope.
                </p>
                <div className="mt-3 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg p-3">
                  Scoped totals: Revenue {toCurrency(totalRevenue)} | Expense {toCurrency(totalExpenses)} | Profit/Loss {toCurrency(profit)}
                </div>
              </div>

              {latestPeriod && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Latest Period</p>
                    <p className="font-semibold text-gray-900">{latestPeriod.season} {latestPeriod.seasonYear}</p>
                    <p className={`text-sm mt-2 ${latestPeriod.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      Net: {toCurrency(latestPeriod.profit)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Compared to Previous Period</p>
                    {previousPeriod ? (
                      <>
                        <p className="font-semibold text-gray-900">
                          {previousPeriod.season} {previousPeriod.seasonYear}
                        </p>
                        <p
                          className={`text-sm mt-2 ${
                            latestPeriod.profit - previousPeriod.profit >= 0
                              ? 'text-green-700'
                              : 'text-red-700'
                          }`}
                        >
                          Change: {toCurrency(latestPeriod.profit - previousPeriod.profit)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-600 mt-2">Not enough history for comparison.</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Distribution</h3>
                {expenseCategoryEntries.length === 0 ? (
                  <p className="text-sm text-gray-600">No expense entries for the selected period.</p>
                ) : (
                  <div className="space-y-3">
                    {expenseCategoryEntries.map(([category, amount]) => {
                      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700">{category}</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {toCurrency(amount)} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue vs Expense</h3>
                {monthlySummary.length === 0 ? (
                  <p className="text-sm text-gray-600">No monthly data available for selected filters.</p>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="text-left px-4 py-2">Month</th>
                          <th className="text-right px-4 py-2">Revenue</th>
                          <th className="text-right px-4 py-2">Expense</th>
                          <th className="text-right px-4 py-2">Profit/Loss</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlySummary.map((entry) => (
                          <tr key={entry.monthKey} className="border-t border-gray-100">
                            <td className="px-4 py-2 text-gray-700">{entry.monthLabel}</td>
                            <td className="px-4 py-2 text-right text-gray-900">{toCurrency(entry.revenue)}</td>
                            <td className="px-4 py-2 text-right text-gray-900">{toCurrency(entry.expenses)}</td>
                            <td
                              className={`px-4 py-2 text-right font-semibold ${
                                entry.profit >= 0 ? 'text-green-700' : 'text-red-700'
                              }`}
                            >
                              {toCurrency(entry.profit)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Season-wise Profit Comparison</h3>
                {periodSummary.length === 0 ? (
                  <p className="text-sm text-gray-600">Add entries with season/year to compare periods.</p>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="text-left px-4 py-2">Season/Year</th>
                          <th className="text-right px-4 py-2">Revenue</th>
                          <th className="text-right px-4 py-2">Expense</th>
                          <th className="text-right px-4 py-2">Profit/Loss</th>
                          <th className="text-right px-4 py-2">Vs Previous</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...periodSummary]
                          .sort((firstEntry, secondEntry) =>
                            comparePeriods(
                              secondEntry.season,
                              secondEntry.seasonYear,
                              firstEntry.season,
                              firstEntry.seasonYear
                            )
                          )
                          .map((entry) => (
                            <tr key={entry.periodKey} className="border-t border-gray-100">
                              <td className="px-4 py-2 text-gray-700">
                                {entry.season} {entry.seasonYear}
                              </td>
                              <td className="px-4 py-2 text-right text-gray-900">{toCurrency(entry.revenue)}</td>
                              <td className="px-4 py-2 text-right text-gray-900">{toCurrency(entry.expenses)}</td>
                              <td
                                className={`px-4 py-2 text-right font-semibold ${
                                  entry.profit >= 0 ? 'text-green-700' : 'text-red-700'
                                }`}
                              >
                                {toCurrency(entry.profit)}
                              </td>
                              <td
                                className={`px-4 py-2 text-right font-semibold ${
                                  entry.deltaFromPrevious === null
                                    ? 'text-gray-500'
                                    : entry.deltaFromPrevious >= 0
                                      ? 'text-green-700'
                                      : 'text-red-700'
                                }`}
                              >
                                {getDeltaLabel(entry.deltaFromPrevious)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Same Crop: Current vs Previous Season
                </h3>
                {sameCropComparisonRows.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    Add crop-related expenses and crop sales to compare crop performance.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="text-left px-4 py-2">Crop</th>
                          <th className="text-left px-4 py-2">Current Season/Year</th>
                          <th className="text-right px-4 py-2">Current Revenue</th>
                          <th className="text-right px-4 py-2">Current Expense</th>
                          <th className="text-right px-4 py-2">Current Profit/Loss</th>
                          <th className="text-left px-4 py-2">Previous Season/Year</th>
                          <th className="text-right px-4 py-2">Previous Revenue</th>
                          <th className="text-right px-4 py-2">Previous Expense</th>
                          <th className="text-right px-4 py-2">Previous Profit/Loss</th>
                          <th className="text-right px-4 py-2">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sameCropComparisonRows.map((entry) => (
                          <tr
                            key={`${entry.crop}-${entry.currentSeason}-${entry.currentSeasonYear}`}
                            className="border-t border-gray-100"
                          >
                            <td className="px-4 py-2 text-gray-700">{entry.crop}</td>
                            <td className="px-4 py-2 text-gray-700">
                              {entry.currentSeason} {entry.currentSeasonYear}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-900">{toCurrency(entry.currentRevenue)}</td>
                            <td className="px-4 py-2 text-right text-gray-900">{toCurrency(entry.currentExpenses)}</td>
                            <td
                              className={`px-4 py-2 text-right font-semibold ${
                                entry.currentProfit >= 0 ? 'text-green-700' : 'text-red-700'
                              }`}
                            >
                              {toCurrency(entry.currentProfit)}
                            </td>
                            <td className="px-4 py-2 text-gray-700">
                              {entry.previousSeason && entry.previousSeasonYear
                                ? `${entry.previousSeason} ${entry.previousSeasonYear}`
                                : '-'}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-900">
                              {entry.previousRevenue === null ? '-' : toCurrency(entry.previousRevenue)}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-900">
                              {entry.previousExpenses === null ? '-' : toCurrency(entry.previousExpenses)}
                            </td>
                            <td
                              className={`px-4 py-2 text-right font-semibold ${
                                entry.previousProfit === null
                                  ? 'text-gray-500'
                                  : entry.previousProfit >= 0
                                    ? 'text-green-700'
                                    : 'text-red-700'
                              }`}
                            >
                              {entry.previousProfit === null ? '-' : toCurrency(entry.previousProfit)}
                            </td>
                            <td
                              className={`px-4 py-2 text-right font-semibold ${
                                entry.changeFromPrevious === null
                                  ? 'text-gray-500'
                                  : entry.changeFromPrevious >= 0
                                    ? 'text-green-700'
                                    : 'text-red-700'
                              }`}
                            >
                              {getDeltaLabel(entry.changeFromPrevious)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Suggestions to Reduce Losses and Increase Profit
                </h3>
                <div className="space-y-3">
                  {recommendations.map((recommendation) => (
                    <div
                      key={recommendation.title}
                      className={`rounded-lg border p-4 ${insightStyles[recommendation.severity]}`}
                    >
                      <p className="font-semibold text-sm">{recommendation.title}</p>
                      <p className="text-sm mt-1">{recommendation.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setEditingExpenseId(null);
                  resetExpenseForm();
                  setShowExpenseForm((previousValue) => !previousValue);
                  setError('');
                  setSuccess('');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Expense
              </button>

              {showExpenseForm && (
                <form onSubmit={handleAddExpense} className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-gray-700">
                    {editingExpenseId ? 'Edit Expense Entry' : 'Add Expense Entry'}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                      value={expenseForm.category}
                      onChange={(event) =>
                        setExpenseForm({ ...expenseForm, category: event.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option>Seeds</option>
                      <option>Fertilizers</option>
                      <option>Labor</option>
                      <option>Machinery</option>
                      <option>Water</option>
                      <option>Pesticides</option>
                      <option>Transport</option>
                      <option>Storage</option>
                    </select>

                    <input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })}
                      placeholder="Amount (Rs.)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />

                    <input
                      type="date"
                      value={expenseForm.expenseDate}
                      onChange={(event) =>
                        setExpenseForm({ ...expenseForm, expenseDate: event.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />

                    <select
                      value={expenseForm.season}
                      onChange={(event) =>
                        setExpenseForm({ ...expenseForm, season: event.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    >
                      {SEASON_OPTIONS.map((season) => (
                        <option key={season} value={season}>
                          {season}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={2000}
                      max={2100}
                      value={expenseForm.seasonYear}
                      onChange={(event) =>
                        setExpenseForm({ ...expenseForm, seasonYear: event.target.value })
                      }
                      placeholder="Season Year"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />

                    <select
                      value={expenseForm.cropOption}
                      onChange={(event) =>
                        setExpenseForm({
                          ...expenseForm,
                          cropOption: event.target.value,
                          customCropName:
                            event.target.value === CROP_OTHER_OPTION
                              ? expenseForm.customCropName
                              : '',
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value={CROP_NOT_LINKED_OPTION}>Not Linked to a Crop</option>
                      {cropFormOptions.map((crop) => (
                        <option key={crop} value={crop}>
                          {crop}
                        </option>
                      ))}
                      <option value={CROP_OTHER_OPTION}>Other</option>
                    </select>

                    {expenseForm.cropOption === CROP_OTHER_OPTION && (
                      <input
                        type="text"
                        value={expenseForm.customCropName}
                        onChange={(event) =>
                          setExpenseForm({ ...expenseForm, customCropName: event.target.value })
                        }
                        placeholder="Enter crop name"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      />
                    )}
                  </div>

                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(event) =>
                      setExpenseForm({ ...expenseForm, description: event.target.value })
                    }
                    placeholder="Description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      {editingExpenseId ? 'Update' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowExpenseForm(false);
                        setEditingExpenseId(null);
                        resetExpenseForm();
                        setError('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {expensesForList.length === 0 ? (
                  <p className="text-sm text-gray-600">No expenses added yet.</p>
                ) : (
                  expensesForList.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{expense.category}</p>
                        <p className="text-sm text-gray-600">{expense.description || 'No description'}</p>
                        <p className="text-xs text-gray-500">
                          {expense.parsedDate.toLocaleDateString('en-IN')} |{' '}
                          {getPeriodLabel(
                            expense.season,
                            expense.season_year,
                            expense.expense_date
                          )}
                        </p>
                        {expense.crop_related && (
                          <p className="text-xs text-gray-500">Crop: {normalizeCropName(expense.crop_related)}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">-{toCurrency(expense.amount)}</p>
                        <button
                          type="button"
                          onClick={() => startEditingExpense(expense)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setEditingPaymentId(null);
                  resetRevenueForm();
                  setShowRevenueForm((previousValue) => !previousValue);
                  setError('');
                  setSuccess('');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Record Sale
              </button>

              {showRevenueForm && (
                <form onSubmit={handleAddRevenue} className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-gray-700">
                    {editingPaymentId ? 'Edit Revenue Entry' : 'Record Revenue Entry'}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                      value={revenueForm.cropOption}
                      onChange={(event) =>
                        setRevenueForm({
                          ...revenueForm,
                          cropOption: event.target.value,
                          customCropName:
                            event.target.value === CROP_OTHER_OPTION
                              ? revenueForm.customCropName
                              : '',
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    >
                      {cropFormOptions.map((crop) => (
                        <option key={crop} value={crop}>
                          {crop}
                        </option>
                      ))}
                      <option value={CROP_OTHER_OPTION}>Other</option>
                    </select>

                    {revenueForm.cropOption === CROP_OTHER_OPTION && (
                      <input
                        type="text"
                        value={revenueForm.customCropName}
                        onChange={(event) =>
                          setRevenueForm({ ...revenueForm, customCropName: event.target.value })
                        }
                        placeholder="Enter crop name"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      />
                    )}

                    <input
                      type="number"
                      value={revenueForm.quantity}
                      onChange={(event) =>
                        setRevenueForm({ ...revenueForm, quantity: event.target.value })
                      }
                      placeholder="Quantity"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />

                    <input
                      type="date"
                      value={revenueForm.saleDate}
                      onChange={(event) =>
                        setRevenueForm({ ...revenueForm, saleDate: event.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />

                    <select
                      value={revenueForm.season}
                      onChange={(event) =>
                        setRevenueForm({ ...revenueForm, season: event.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    >
                      {SEASON_OPTIONS.map((season) => (
                        <option key={season} value={season}>
                          {season}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={2000}
                      max={2100}
                      value={revenueForm.seasonYear}
                      onChange={(event) =>
                        setRevenueForm({ ...revenueForm, seasonYear: event.target.value })
                      }
                      placeholder="Season Year"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />

                    <input
                      type="text"
                      value={revenueForm.buyerName}
                      onChange={(event) =>
                        setRevenueForm({ ...revenueForm, buyerName: event.target.value })
                      }
                      placeholder="Buyer Name"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />

                    <input
                      type="number"
                      value={revenueForm.amountReceived}
                      onChange={(event) =>
                        setRevenueForm({ ...revenueForm, amountReceived: event.target.value })
                      }
                      placeholder="Amount Received (Rs.)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />

                    <input
                      type="number"
                      value={revenueForm.pendingAmount}
                      onChange={(event) =>
                        setRevenueForm({ ...revenueForm, pendingAmount: event.target.value })
                      }
                      placeholder="Pending Amount (Rs.)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      {editingPaymentId ? 'Update' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRevenueForm(false);
                        setEditingPaymentId(null);
                        resetRevenueForm();
                        setError('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {paymentsForList.length === 0 ? (
                  <p className="text-sm text-gray-600">No revenue entries added yet.</p>
                ) : (
                  paymentsForList.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{normalizeCropName(payment.crop_sold)}</p>
                        <p className="text-sm text-gray-600">
                          {payment.quantity} units{payment.buyer_name ? ` | ${payment.buyer_name}` : ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.parsedDate.toLocaleDateString('en-IN')} |{' '}
                          {getPeriodLabel(payment.season, payment.season_year, payment.sale_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          +{toCurrency(payment.amount_received)}
                        </p>
                        {payment.pending_amount > 0 && (
                          <p className="text-xs text-amber-600">
                            {toCurrency(payment.pending_amount)} pending
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => startEditingPayment(payment)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

