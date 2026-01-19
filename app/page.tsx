// app/page.tsx
'use client';
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Client = {
  id: string;
  firstname: string;
  lastname: string;
  phone: string;
  email: string | null;
};

type TabId =
  | 'about'
  | 'goals'
  | 'assets'
  | 'liabilities'
  | 'insurance'
  | 'income';

const TABS: { id: TabId; label: string }[] = [
  { id: 'about',       label: 'Client & Family' },
  { id: 'goals',       label: 'Goals & Properties' },
  { id: 'assets',      label: 'Assets' },
  { id: 'liabilities', label: 'Liabilities' },
  { id: 'insurance',   label: 'Insurance' },
  { id: 'income',      label: 'Income & Estate' },
];

export default function FnaPage() {
  const supabase = createClientComponentClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('about');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Single form state for the whole FNA header (simplified)
  const [form, setForm] = useState<any>({
    spouse_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    more_children_planned: null,
    more_children_count: '',
    goals_text: '',
    own_or_rent: '',
    properties_notes: '',
    has_old_401k: null,
    expects_lump_sum: null,
    li_debt: '',
    li_income: '',
    li_mortgage: '',
    li_education: '',
    li_insurance_in_place: '',
    retirement_monthly_need: '',
    monthly_commitment: '',
    next_appointment_date: '',
    next_appointment_time: '',
  });

  const [fnaId, setFnaId] = useState<string | null>(null);

  // Load clients
  useEffect(() => {
    const loadClients = async () => {
      const { data, error } = await supabase
        .from('clientregistrations')
        .select('id, firstname, lastname, phone, email')
        .order('createdat', { ascending: false });

      if (!error && data) {
        setClients(data as Client[]);
      } else {
        console.error(error);
      }
    };
    loadClients();
  }, [supabase]);

  // Load or create FNA for selected client
  useEffect(() => {
    if (!selectedClient) return;

    const loadFna = async () => {
      const { data, error } = await supabase
        .from('fna_header')
        .select('*')
        .eq('client_id', selectedClient.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        return;
      }

      if (data) {
        setFnaId(data.id);
        setForm((prev: any) => ({ ...prev, ...data }));
      } else {
        // create new empty header row
        const { data: inserted, error: insertError } = await supabase
          .from('fna_header')
          .insert({ client_id: selectedClient.id })
          .select()
          .single();

        if (!insertError && inserted) {
          setFnaId(inserted.id);
          setForm((prev: any) => ({ ...prev, ...inserted }));
        }
      }
    };

    loadFna();
  }, [selectedClient, supabase]);

  const handleChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedClient || !fnaId) return;
    setIsSaving(true);
    setStatusMsg(null);

    const payload = {
      ...form,
      more_children_count:
        form.more_children_count === '' ? null : Number(form.more_children_count),
      li_debt: form.li_debt === '' ? null : Number(form.li_debt),
      li_income: form.li_income === '' ? null : Number(form.li_income),
      li_mortgage: form.li_mortgage === '' ? null : Number(form.li_mortgage),
      li_education: form.li_education === '' ? null : Number(form.li_education),
      li_insurance_in_place:
        form.li_insurance_in_place === '' ? null : Number(form.li_insurance_in_place),
      retirement_monthly_need:
        form.retirement_monthly_need === ''
          ? null
          : Number(form.retirement_monthly_need),
      monthly_commitment:
        form.monthly_commitment === '' ? null : Number(form.monthly_commitment),
    };

    const { error } = await supabase
      .from('fna_header')
      .update(payload)
      .eq('id', fnaId);

    setIsSaving(false);
    if (error) {
      console.error(error);
      setStatusMsg('Error saving changes. Please try again.');
    } else {
      setStatusMsg('Saved successfully.');
    }
  };

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.firstname.toLowerCase().includes(q) ||
      c.lastname.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Client picker */}
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold mb-2">
          Select Client for Financial Needs Analysis
        </h1>
        <p className="text-sm text-slate-600 mb-3">
          Start by choosing an existing client from registrations. Then complete
          the FNA in the tabs below.
        </p>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
          <input
            type="text"
            placeholder="Search by first name, last name, or phone"
            className="w-full md:w-80 rounded border px-3 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {selectedClient && (
            <div className="text-xs text-slate-600">
              Active client:{' '}
              <span className="font-medium">
                {selectedClient.firstname} {selectedClient.lastname}
              </span>{' '}
              ({selectedClient.phone})
            </div>
          )}
        </div>

        <div className="max-h-56 overflow-auto rounded border">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2">First</th>
                <th className="px-3 py-2">Last</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c) => (
                <tr
                  key={c.id}
                  className={
                    selectedClient?.id === c.id
                      ? 'bg-blue-50'
                      : 'hover:bg-slate-50'
                  }
                >
                  <td className="px-3 py-2">{c.firstname}</td>
                  <td className="px-3 py-2">{c.lastname}</td>
                  <td className="px-3 py-2">{c.phone}</td>
                  <td className="px-3 py-2">{c.email}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                      onClick={() => setSelectedClient(c)}
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-3 text-center text-slate-500"
                  >
                    No clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tabs + form */}
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-1 border-b">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`px-3 py-2 text-xs font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab(tab.id)}
              disabled={!selectedClient}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!selectedClient && (
          <p className="text-sm text-slate-500">
            Select a client above to begin the Financial Needs Analysis.
          </p>
        )}

        {selectedClient && (
          <>
            {activeTab === 'about' && (
              <AboutTab form={form} onChange={handleChange} />
            )}
            {activeTab === 'goals' && (
              <GoalsTab form={form} onChange={handleChange} />
            )}
            {activeTab === 'assets' && (
              <AssetsTab form={form} onChange={handleChange} />
            )}
            {activeTab === 'liabilities' && (
              <LiabilitiesTab />
            )}
            {activeTab === 'insurance' && (
              <InsuranceTab form={form} onChange={handleChange} />
            )}
            {activeTab === 'income' && (
              <IncomeTab form={form} onChange={handleChange} />
            )}

            <div className="mt-6 flex items-center justify-between border-t pt-3">
              {statusMsg && (
                <p className="text-xs text-slate-600">{statusMsg}</p>
              )}
              <button
                type="button"
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? 'Saving...' : 'Save FNA'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

type TabProps = {
  form?: any;
  onChange?: (field: string, value: any) => void;
};

/* === Tab components – simplified, user friendly === */

function InputRow(props: {
  label: string;
  field: string;
  value: any;
  onChange: (f: string, v: any) => void;
  type?: string;
  placeholder?: string;
}) {
  const { label, field, value, onChange, type = 'text', placeholder } = props;
  return (
    <label className="flex flex-col gap-1 text-xs md:text-sm">
      <span className="text-slate-700">{label}</span>
      <input
        type={type}
        className="rounded border px-3 py-2 text-sm"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(field, e.target.value)}
      />
    </label>
  );
}

function TextAreaRow(props: {
  label: string;
  field: string;
  value: any;
  onChange: (f: string, v: any) => void;
  rows?: number;
  placeholder?: string;
}) {
  const { label, field, value, onChange, rows = 3, placeholder } = props;
  return (
    <label className="flex flex-col gap-1 text-xs md:text-sm">
      <span className="text-slate-700">{label}</span>
      <textarea
        className="rounded border px-3 py-2 text-sm"
        rows={rows}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(field, e.target.value)}
      />
    </label>
  );
}

function YesNoRow(props: {
  label: string;
  field: string;
  value: boolean | null;
  onChange: (f: string, v: any) => void;
}) {
  const { label, field, value, onChange } = props;
  return (
    <div className="flex flex-col gap-1 text-xs md:text-sm">
      <span className="text-slate-700">{label}</span>
      <div className="inline-flex gap-3">
        <button
          type="button"
          className={`rounded border px-3 py-1 text-xs ${
            value === true ? 'bg-blue-600 text-white' : 'bg-white'
          }`}
          onClick={() => onChange(field, true)}
        >
          Yes
        </button>
        <button
          type="button"
          className={`rounded border px-3 py-1 text-xs ${
            value === false ? 'bg-blue-600 text-white' : 'bg-white'
          }`}
          onClick={() => onChange(field, false)}
        >
          No
        </button>
      </div>
    </div>
  );
}

function AboutTab({ form, onChange }: TabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold">Tell us about you</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <InputRow
          label="Spouse name"
          field="spouse_name"
          value={form.spouse_name}
          onChange={onChange!}
        />
        <InputRow
          label="Address"
          field="address"
          value={form.address}
          onChange={onChange!}
        />
        <InputRow
          label="City"
          field="city"
          value={form.city}
          onChange={onChange!}
        />
        <InputRow
          label="State"
          field="state"
          value={form.state}
          onChange={onChange!}
        />
        <InputRow
          label="ZIP code"
          field="zip_code"
          value={form.zip_code}
          onChange={onChange!}
        />
      </div>

      <h3 className="text-sm font-semibold">Children & education funding</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <YesNoRow
          label="Do you plan to have more children?"
          field="more_children_planned"
          value={form.more_children_planned}
          onChange={onChange!}
        />
        <InputRow
          label="If yes, how many?"
          field="more_children_count"
          value={form.more_children_count}
          onChange={onChange!}
          type="number"
        />
      </div>
      <p className="text-xs text-slate-500">
        Detailed child-by-child education savings can be captured later in a
        dedicated grid.
      </p>
    </div>
  );
}

function GoalsTab({ form, onChange }: TabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold">Tell us about your goals</h2>
      <TextAreaRow
        label="What financial goals are most important to you in the next 5–10 years?"
        field="goals_text"
        value={form.goals_text}
        onChange={onChange!}
        rows={4}
      />

      <h3 className="text-sm font-semibold">Properties</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <InputRow
          label="Do you own or rent?"
          field="own_or_rent"
          value={form.own_or_rent}
          onChange={onChange!}
          placeholder="Own / Rent"
        />
        <TextAreaRow
          label="Notes about your home(s) or properties"
          field="properties_notes"
          value={form.properties_notes}
          onChange={onChange!}
          rows={3}
        />
      </div>
      <p className="text-xs text-slate-500">
        A separate properties grid (address, mortgage, value, balance) can be
        layered on top of this summary later.
      </p>
    </div>
  );
}

function AssetsTab({ form, onChange }: TabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold">Tell us about your assets</h2>
      <p className="text-xs text-slate-600">
        Use this section to capture tax-advantaged, taxable and tax-deferred
        savings and investments. Later you can add line-item grids that match
        the PDF exactly.
      </p>

      <YesNoRow
        label="Do you have a 401(k) from a previous employer?"
        field="has_old_401k"
        value={form.has_old_401k}
        onChange={onChange!}
      />
      <YesNoRow
        label="Do you expect any lump sums or inheritance in the near future?"
        field="expects_lump_sum"
        value={form.expects_lump_sum}
        onChange={onChange!}
      />
    </div>
  );
}

function LiabilitiesTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold">Tell us about your liabilities</h2>
      <p className="text-xs text-slate-600">
        List credit cards, auto loans, student loans and other debts with
        balance, rate and payment in the detailed table. This UX placeholder can
        later connect directly to the fna_liabilities table.
      </p>
      <p className="text-xs text-slate-500">
        For now, use your existing spreadsheet or notes during the appointment,
        and capture summaries here in future iterations.
      </p>
    </div>
  );
}

function InsuranceTab({ form, onChange }: TabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold">Tell us about your insurance</h2>
      <p className="text-xs text-slate-600">
        Capture high-level details for client and spouse life insurance and
        health coverage. A detailed policy grid can be added later.
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        <InputRow
          label="Total debt to cover"
          field="li_debt"
          value={form.li_debt}
          onChange={onChange!}
          type="number"
        />
        <InputRow
          label="Income replacement amount"
          field="li_income"
          value={form.li_income}
          onChange={onChange!}
          type="number"
        />
        <InputRow
          label="Mortgage payoff amount"
          field="li_mortgage"
          value={form.li_mortgage}
          onChange={onChange!}
          type="number"
        />
        <InputRow
          label="Education funding amount"
          field="li_education"
          value={form.li_education}
          onChange={onChange!}
          type="number"
        />
        <InputRow
          label="Existing life insurance (total)"
          field="li_insurance_in_place"
          value={form.li_insurance_in_place}
          onChange={onChange!}
          type="number"
        />
      </div>
      <p className="text-xs text-slate-500">
        The insurance need analysis in the PDF can be computed automatically
        from these numbers in a later enhancement.
      </p>
    </div>
  );
}

function IncomeTab({ form, onChange }: TabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold">Tell us about your income</h2>
      <p className="text-xs text-slate-600">
        Capture the household income picture and retirement readiness. Detailed
        income sources will be stored per person in the fna_income table.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <InputRow
          label="If you retired today, how much monthly income would you need?"
          field="retirement_monthly_need"
          value={form.retirement_monthly_need}
          onChange={onChange!}
          type="number"
        />
        <InputRow
          label="Aside from what you currently do, how much are you committed to set aside monthly?"
          field="monthly_commitment"
          value={form.monthly_commitment}
          onChange={onChange!}
          type="number"
        />
        <InputRow
          label="Next appointment date"
          field="next_appointment_date"
          value={form.next_appointment_date}
          onChange={onChange!}
          type="date"
        />
        <InputRow
          label="Next appointment time"
          field="next_appointment_time"
          value={form.next_appointment_time}
          onChange={onChange!}
          type="time"
        />
      </div>
    </div>
  );
}
