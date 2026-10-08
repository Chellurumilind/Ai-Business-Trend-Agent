import React, { useState } from 'react';
import { Lightbulb, MessageSquareText, Send, Sparkles } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { insightsAPI } from '../api/client';

const suggestedQuestions = [
  'Why did expenses increase recently?',
  'Which category is spending the most?',
  'How healthy is the business right now?',
  'What should I focus on next month?',
];

const Insights = () => {
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [question, setQuestion] = useState('');
  const [error, setError] = useState(null);

  const generateInsights = async () => {
    try {
      setLoading(true); setError(null);
      const response = await insightsAPI.generate();
      setInsights(response.data);
    } catch (err) { setError(err.response?.data?.detail || 'Failed to generate insights.'); }
    finally { setLoading(false); }
  };

  const askQuestion = async (event) => {
    event?.preventDefault();
    if (!question.trim()) return;
    try {
      setChatLoading(true); setError(null);
      const response = await insightsAPI.ask(question.trim());
      setAnswer(response.data);
    } catch (err) { setError(err.response?.data?.detail || 'Failed to answer the question.'); }
    finally { setChatLoading(false); }
  };

  const chooseQuestion = (value) => { setQuestion(value); setAnswer(null); };

  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">{error}</div>}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3"><div className="rounded-lg bg-purple-100 p-3 text-purple-600 dark:bg-purple-900/20"><Lightbulb className="h-6 w-6" /></div><div><h2 className="text-2xl font-bold">AI Business Insights</h2><p className="text-sm text-gray-500">Generate a professional report from your business data.</p></div></div>
          {loading ? <LoadingSpinner message="AI is analyzing your business data…" /> : !insights ? <div className="py-20 text-center"><Sparkles className="mx-auto mb-5 h-16 w-16 text-purple-500" /><p className="mx-auto mb-7 max-w-md text-gray-600 dark:text-gray-300">Generate a professional report based on your latest business performance.</p><button onClick={generateInsights} className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-3 font-medium text-white hover:bg-purple-700"><Sparkles className="h-5 w-5" />Generate Insights</button></div> : <div className="mt-8"><div className="mb-4 flex items-center justify-between border-b pb-3 text-sm text-gray-500 dark:border-gray-700"><span>Provider: {insights.provider} ({insights.model})</span><button onClick={generateInsights} className="font-medium text-purple-600 hover:underline">Regenerate</button></div><div className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">{insights.insights}</div></div>}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3"><div className="rounded-lg bg-primary-100 p-3 text-primary-600 dark:bg-primary-900/20"><MessageSquareText className="h-6 w-6" /></div><div><h2 className="text-2xl font-bold">Ask Your Business Data</h2><p className="text-sm text-gray-500">Chat with your revenue, expense, trend, and category data.</p></div></div>
          <div className="mt-7 rounded-xl border border-dashed border-gray-300 p-5 dark:border-gray-600"><div className="mb-4 flex items-center gap-2 font-medium"><Sparkles className="h-5 w-5 text-primary-500" />Try one of these questions</div><div className="space-y-3">{suggestedQuestions.map((item) => <button key={item} onClick={() => chooseQuestion(item)} className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-left text-sm text-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">{item}</button>)}</div></div>
          <form onSubmit={askQuestion} className="mt-6"><label className="sr-only" htmlFor="business-question">Your question</label><textarea id="business-question" value={question} onChange={(event) => setQuestion(event.target.value)} rows="3" maxLength="500" placeholder="Ask something like: Which category is hurting profit the most?" className="w-full resize-y rounded-xl border border-gray-300 bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700" /><button disabled={chatLoading || !question.trim()} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-3 font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"><Send className="h-4 w-4" />{chatLoading ? 'Asking…' : 'Ask'}</button></form>
          {answer && <div className="mt-6 rounded-xl bg-gray-50 p-5 dark:bg-gray-700/60"><div className="mb-2 text-sm font-medium text-gray-500">Answer · {answer.provider} ({answer.model})</div><p className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-200">{answer.answer}</p></div>}
        </section>
      </div>
    </div>
  );
};

export default Insights;
