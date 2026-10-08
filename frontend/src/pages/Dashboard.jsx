/**
 * pages/Dashboard.jsx
 * -------------------
 * Main dashboard showing KPIs and charts.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { analyticsAPI, transactionAPI } from '../api/client';

const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 2,
}).format(amount);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsResponse, transactionsResponse] = await Promise.all([
        analyticsAPI.getSummary(),
        transactionAPI.getAll({ limit: 5 }),
      ]);
      setData(analyticsResponse.data);
      setRecentTransactions(transactionsResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return (
    <div className="text-center py-12">
      <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
      <button
        onClick={fetchData}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        Retry
      </button>
    </div>
  );
  if (!data) return null;

  const { summary, monthly, growth } = data;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Business Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time analytics and financial insights
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(summary.total_revenue)}
          subtitle={`${summary.total_records} transactions`}
          icon={DollarSign}
          color="green"
        />
        <KPICard
          title="Total Expense"
          value={formatCurrency(summary.total_expense)}
          icon={TrendingDown}
          color="red"
        />
        <KPICard
          title="Net Profit"
          value={formatCurrency(summary.net_profit)}
          icon={TrendingUp}
          color={summary.net_profit >= 0 ? 'green' : 'red'}
        />
        <KPICard
          title="ROI"
          value={`${summary.roi}%`}
          subtitle={growth.trend_direction}
          icon={Activity}
          color="primary"
          trend={
            growth.avg_revenue_growth > 0
              ? { direction: 'up', value: `+${growth.avg_revenue_growth}% avg` }
              : { direction: 'down', value: `${growth.avg_revenue_growth}% avg` }
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expense */}
        <ChartCard title="Revenue vs Expense">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
              <Bar dataKey="expense" fill="#EF4444" name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Monthly ROI */}
        <ChartCard title="Monthly ROI Trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="roi"
                stroke="#3B82F6"
                strokeWidth={3}
                name="ROI %"
                dot={{ fill: '#3B82F6', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Growth Analysis */}
      {growth.monthly_growth && growth.monthly_growth.length > 0 && (
        <ChartCard title="Month-over-Month Growth">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growth.monthly_growth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue_growth"
                stroke="#10B981"
                strokeWidth={2}
                name="Revenue Growth %"
              />
              <Line
                type="monotone"
                dataKey="expense_growth"
                stroke="#EF4444"
                strokeWidth={2}
                name="Expense Growth %"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your latest recorded revenue and expense activity.</p>
          </div>
          <Link to="/transactions" className="text-sm font-medium text-primary-600 hover:underline">View all</Link>
        </div>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? <p className="py-4 text-center text-sm text-gray-500">No transactions yet. Add your first transaction to begin.</p> : recentTransactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-700">
              <div className="min-w-0"><div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${transaction.type === 'revenue' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{transaction.type}</span><span className="truncate font-medium text-gray-900 dark:text-white">{transaction.category}</span></div><p className="mt-1 pl-1 text-sm text-gray-500">{transaction.campaign || 'No campaign'} · {new Date(transaction.created_at).toLocaleString('en-IN')}</p></div>
              <span className={`shrink-0 font-semibold ${transaction.type === 'revenue' ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(transaction.amount)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
