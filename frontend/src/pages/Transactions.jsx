import React, { useCallback, useEffect, useState } from 'react';
import {
  Download, FileSpreadsheet, Filter, ReceiptText, RotateCcw,
  Save, Search, Trash2, Upload, X
} from 'lucide-react';
import { transactionAPI } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const emptyForm = { amount: '', type: 'revenue', category: '', campaign: '' };
const emptyFilters = { type: '', category: '', campaign: '', from: '', to: '' };
const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 2,
}).format(amount);

const parseCsvRow = (row) => {
  const values = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < row.length; index += 1) {
    const char = row[index];
    if (char === '"' && row[index + 1] === '"') {
      value += '"'; index += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { values.push(value.trim()); value = ''; }
    else value += char;
  }
  values.push(value.trim());
  return values;
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState(emptyFilters);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadTransactions = useCallback(async (activeFilters = emptyFilters) => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(activeFilters).filter(([, value]) => value !== '')
      );
      const response = await transactionAPI.getAll({ ...params, limit: 500 });
      setTransactions(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load transactions. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTransactions(emptyFilters); }, [loadTransactions]);

  const submitTransaction = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await transactionAPI.create({
        amount: Number(form.amount), type: form.type,
        category: form.category, campaign: form.campaign || null,
      });
      setForm(emptyForm);
      setMessage('Transaction saved successfully.');
      await loadTransactions(filters);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save the transaction.');
    } finally { setSaving(false); }
  };

  const importCsv = async () => {
    if (!selectedFile) { setError('Choose a CSV file before importing.'); return; }
    try {
      setSaving(true); setError(null);
      const content = await selectedFile.text();
      const rows = content.split(/\r?\n/).filter((row) => row.trim());
      if (rows.length < 2) throw new Error('The CSV must include a header row and at least one transaction.');
      const headers = parseCsvRow(rows.shift()).map((header) => header.toLowerCase().replace(/^\uFEFF/, ''));
      const required = ['amount', 'type', 'category'];
      if (required.some((column) => !headers.includes(column))) {
        throw new Error('CSV must include amount, type, and category columns.');
      }
      const records = rows.map((row, rowIndex) => {
        const cells = parseCsvRow(row);
        const item = Object.fromEntries(headers.map((header, index) => [header, cells[index] || '']));
        const type = item.type.toLowerCase();
        if (!Number(item.amount) || !['revenue', 'expense'].includes(type) || !item.category.trim()) {
          throw new Error(`Invalid data on CSV row ${rowIndex + 2}.`);
        }
        return {
          amount: Number(item.amount), type, category: item.category.trim(),
          campaign: item.campaign?.trim() || null,
          created_at: item.created_at?.trim() || undefined,
        };
      });
      await Promise.all(records.map((record) => transactionAPI.create(record)));
      setSelectedFile(null);
      setMessage(`${records.length} transaction${records.length === 1 ? '' : 's'} imported successfully.`);
      await loadTransactions(filters);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Could not import the CSV file.');
    } finally { setSaving(false); }
  };

  const exportCsv = () => {
    const lines = [
      'amount,type,category,campaign,created_at',
      ...transactions.map((item) => [item.amount, item.type, item.category, item.campaign || '', item.created_at]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')),
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'business-transactions.csv'; link.click();
    URL.revokeObjectURL(url);
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm('Delete this transaction? This cannot be undone.')) return;
    try {
      await transactionAPI.delete(id);
      setMessage('Transaction deleted.');
      await loadTransactions(filters);
    } catch { setError('Could not delete the transaction.'); }
  };

  const applyFilters = (event) => { event.preventDefault(); loadTransactions(filters); };
  const resetFilters = () => { setFilters(emptyFilters); loadTransactions(emptyFilters); };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Transactions</h2>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Review, filter, import, and manage revenue and expense entries.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"><ReceiptText className="h-4 w-4" />{transactions.length} records shown</span>
          <button onClick={exportCsv} disabled={!transactions.length} className="inline-flex items-center gap-2 rounded-lg border border-primary-200 px-3 py-2 text-sm font-medium text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-4 w-4" />Export CSV</button>
        </div>
      </div>

      {(message || error) && <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}><span>{error || message}</span><button onClick={() => { setError(null); setMessage(null); }} aria-label="Dismiss message"><X className="h-4 w-4" /></button></div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={submitTransaction} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex items-center gap-3"><div className="rounded-lg bg-primary-100 p-3 text-primary-600"><ReceiptText className="h-6 w-6" /></div><div><h3 className="text-xl font-bold">Add Transaction</h3><p className="text-sm text-gray-500">Create a new revenue or expense record.</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">Amount (INR)<input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700" /></label>
            <label className="text-sm font-medium">Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"><option value="revenue">Revenue</option><option value="expense">Expense</option></select></label>
            <label className="text-sm font-medium">Category<input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Marketing" className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700" /></label>
            <label className="text-sm font-medium">Campaign<input value={form.campaign} onChange={(e) => setForm({ ...form, campaign: e.target.value })} placeholder="Festive Launch" className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700" /></label>
          </div>
          <button disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-3 font-medium text-white hover:bg-primary-700 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save Transaction'}</button>
        </form>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex items-center gap-3"><div className="rounded-lg bg-green-100 p-3 text-green-600"><FileSpreadsheet className="h-6 w-6" /></div><div><h3 className="text-xl font-bold">Import CSV</h3><p className="text-sm text-gray-500">Bulk-upload transactions to this workspace.</p></div></div>
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300"><p className="font-medium">Expected columns</p><code className="mt-2 block">amount,type,category,campaign,created_at</code><p className="mt-2">Required: <code>amount</code>, <code>type</code>, <code>category</code></p></div>
          <label className="mt-5 block text-sm font-medium">CSV file<input type="file" accept=".csv,text/csv" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="mt-2 block w-full text-sm" /></label>
          <button onClick={importCsv} disabled={saving || !selectedFile} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-60"><Upload className="h-4 w-4" />Import CSV</button>
        </section>
      </div>

      <form onSubmit={applyFilters} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-5 flex items-center gap-2"><Filter className="h-5 w-5 text-primary-600" /><h3 className="text-xl font-bold">Filters</h3></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="text-sm font-medium">Type<select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 dark:border-gray-600 dark:bg-gray-700"><option value="">All types</option><option value="revenue">Revenue</option><option value="expense">Expense</option></select></label>
          <label className="text-sm font-medium">Category<input value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} placeholder="Marketing" className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 dark:border-gray-600 dark:bg-gray-700" /></label>
          <label className="text-sm font-medium">Campaign<input value={filters.campaign} onChange={(e) => setFilters({ ...filters, campaign: e.target.value })} placeholder="Festive Launch" className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 dark:border-gray-600 dark:bg-gray-700" /></label>
          <label className="text-sm font-medium">From<input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 dark:border-gray-600 dark:bg-gray-700" /></label>
          <label className="text-sm font-medium">To<input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 dark:border-gray-600 dark:bg-gray-700" /></label>
        </div>
        <div className="mt-5 flex gap-3"><button className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-3 font-medium text-white hover:bg-primary-700"><Search className="h-4 w-4" />Apply Filters</button><button type="button" onClick={resetFilters} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-3 font-medium"><RotateCcw className="h-4 w-4" />Reset</button></div>
      </form>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700"><h3 className="text-xl font-bold">Transaction records</h3></div>
        {loading ? <LoadingSpinner message="Loading transactions…" /> : transactions.length === 0 ? <p className="p-8 text-center text-gray-500">No transactions match the selected filters.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-500 dark:bg-gray-700"><tr><th className="px-6 py-3">Type</th><th className="px-6 py-3">Category</th><th className="px-6 py-3">Campaign</th><th className="px-6 py-3">Date</th><th className="px-6 py-3 text-right">Amount</th><th className="px-6 py-3" /></tr></thead><tbody>{transactions.map((item) => <tr key={item.id} className="border-t border-gray-100 dark:border-gray-700"><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.type === 'revenue' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.type}</span></td><td className="px-6 py-4 font-medium">{item.category}</td><td className="px-6 py-4 text-gray-500">{item.campaign || 'No campaign'}</td><td className="px-6 py-4 text-gray-500">{new Date(item.created_at).toLocaleDateString('en-IN')}</td><td className={`px-6 py-4 text-right font-semibold ${item.type === 'revenue' ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(item.amount)}</td><td className="px-6 py-4 text-right"><button onClick={() => deleteTransaction(item.id)} className="text-red-500 hover:text-red-700" aria-label={`Delete ${item.category} transaction`}><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
};

export default Transactions;
