'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type FnaRow = {
  id: string;
  created_at: string;
  household_income: number;
  dependents: number;
};

export default function Dashboard() {
  const [fnaList, setFnaList] = useState<FnaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/auth';
        return;
      }

      const { data, error } = await supabase
        .from('fna_sessions')
        .select('id, created_at, household_income, dependents')
        .order('created_at', { ascending: false });

      if (!error && data) setFnaList(data as FnaRow[]);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <p>Loading…</p>;

  return (
    <main className="min-h-screen p-6 bg-slate-100">
      <h1 className="text-2xl font-bold mb-4">Agent Dashboard</h1>
      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Date</th>
            <th className="text-left p-2">Income</th>
            <th className="text-left p-2">Dependents</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {fnaList.map(row => (
            <tr key={row.id} className="border-b">
              <td className="p-2">{new Date(row.created_at).toLocaleString()}</td>
              <td className="p-2">${row.household_income.toLocaleString()}</td>
              <td className="p-2">{row.dependents}</td>
              <td className="p-2">
                <a
                  href={`/dashboard/${row.id}`}
                  className="text-indigo-600 underline text-sm"
                >
                  View / PDF
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
