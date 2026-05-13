import { useState, useEffect } from 'react';
import {
  Plus, Trash2, CalendarDays, Pill,
  Utensils, CheckCircle2, Users,
  Activity, UserPlus,
  ShoppingCart, Copy, Check, Calendar as CalendarIcon, ExternalLink, Download
} from 'lucide-react';

const TIMINGS = ['до еды', 'во время еды', 'после еды'] as const;
type Timing = typeof TIMINGS[number];

type Member = { id: string; name: string; color: string };
type MedForm = 'таблетки' | 'капли' | 'порошок';
type Med = {
  id: number;
  name: string;
  form: MedForm;
  dose: string;
  totalInPackage: string;
  frequency: number | string;
  timing: string;
  duration: number;
  memberId: string;
  startDate: string;
  currentStock: number;
  initialStock: number;
  takenToday: boolean[];
};

const FamilyMedApp = () => {
  const [family, setFamily] = useState<Member[]>([
    { id: 'default', name: 'Я', color: 'indigo' }
  ]);
  const [activeMemberId, setActiveMemberId] = useState('all');
  const [meds, setMeds] = useState<Med[]>([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [view, setView] = useState<'schedule' | 'shopping' | 'calendar'>('schedule');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [formData, setFormData] = useState({
    name: '',
    form: 'таблетки' as MedForm,
    dose: '1',
    totalInPackage: '30',
    frequency: 1 as number | string,
    timing: 'после еды' as Timing,
    duration: 7,
    memberId: 'default',
    startDate: new Date().toISOString().split('T')[0]
  });

  const colors = [
    { name: 'indigo', bg: 'bg-indigo-600', text: 'text-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-100' },
    { name: 'rose', bg: 'bg-rose-600', text: 'text-rose-600', light: 'bg-rose-50', border: 'border-rose-100' },
    { name: 'amber', bg: 'bg-amber-600', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-100' },
    { name: 'emerald', bg: 'bg-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-100' },
    { name: 'sky', bg: 'bg-sky-600', text: 'text-sky-600', light: 'bg-sky-50', border: 'border-sky-100' }
  ];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedMeds = localStorage.getItem('family_meds_lovable_v1');
    const savedFamily = localStorage.getItem('family_members_lovable_v1');
    const today = new Date().toISOString().split('T')[0];
    const lastAccess = localStorage.getItem('last_access_lovable_v1');

    if (savedFamily) setFamily(JSON.parse(savedFamily));

    if (savedMeds) {
      let parsedMeds: Med[] = JSON.parse(savedMeds);
      if (lastAccess !== today) {
        parsedMeds = parsedMeds.map(med => ({
          ...med,
          takenToday: new Array(parseInt(med.frequency as string)).fill(false)
        }));
        localStorage.setItem('last_access_lovable_v1', today);
      }
      setMeds(parsedMeds);
    } else {
      localStorage.setItem('last_access_lovable_v1', today);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('family_meds_lovable_v1', JSON.stringify(meds));
    localStorage.setItem('family_members_lovable_v1', JSON.stringify(family));
  }, [meds, family]);

  const showMessage = (text: string, type: string) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const addMember = () => {
    if (!newMemberName.trim()) return;
    const newMember: Member = {
      id: Date.now().toString(),
      name: newMemberName,
      color: colors[family.length % colors.length].name
    };
    setFamily([...family, newMember]);
    setNewMemberName('');
    setIsAddingMember(false);
    showMessage(`Профиль ${newMemberName} создан`, 'success');
  };

  const addMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    const newMed: Med = {
      id: Date.now(),
      ...formData,
      currentStock: parseFloat(formData.totalInPackage),
      initialStock: parseFloat(formData.totalInPackage),
      takenToday: new Array(parseInt(formData.frequency as string)).fill(false)
    };
    setMeds([newMed, ...meds]);
    setFormData({ ...formData, name: '', dose: '1' });
    showMessage('Препарат добавлен в аптечку', 'success');
  };

  const toggleDose = (medId: number, index: number) => {
    setMeds(meds.map(m => {
      if (m.id === medId) {
        const wasTaken = m.takenToday[index];
        const doseAmount = parseFloat(m.dose) || 1;
        const newStock = wasTaken ? m.currentStock + doseAmount : m.currentStock - doseAmount;
        return {
          ...m,
          takenToday: m.takenToday.map((v, i) => i === index ? !v : v),
          currentStock: Math.max(0, newStock)
        };
      }
      return m;
    }));
  };

  const replenishStock = (id: number) => {
    setMeds(meds.map(m => m.id === id ? { ...m, currentStock: m.initialStock } : m));
    showMessage('Запас пополнен', 'success');
  };

  const deleteMed = (id: number) => setMeds(meds.filter(m => m.id !== id));
  const getMember = (id: string) => family.find(m => m.id === id) || family[0];

  const getDaysLeft = (med: Med) => {
    const dailyConsumption = (parseInt(med.frequency as string) || 0) * (parseFloat(med.dose) || 1);
    return dailyConsumption > 0 ? Math.floor(med.currentStock / dailyConsumption) : 99;
  };

  const filteredMeds = activeMemberId === 'all'
    ? meds
    : meds.filter(m => m.memberId === activeMemberId);

  const shoppingList = meds.filter(m => getDaysLeft(m) <= 3);

  const copyShoppingList = () => {
    const listText = shoppingList.map(m => `- ${m.name} (${getMember(m.memberId).name})`).join('\n');
    const textToCopy = `Нужно купить в аптеке:\n${listText}`;
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showMessage('Список скопирован!', 'success');
    } catch {
      showMessage('Ошибка копирования', 'error');
    }
    document.body.removeChild(textArea);
  };

  // ---- Calendar / Google Calendar helpers ----
  const timingHour = (t: string, idx: number, total: number) => {
    // base hours by timing, distributed across the day
    const baseTimes = total === 1 ? [9] : total === 2 ? [9, 21] : total === 3 ? [9, 14, 21] : Array.from({ length: total }, (_, i) => 8 + Math.round(i * (14 / (total - 1))));
    const h = baseTimes[idx] ?? 9;
    if (t === 'до еды') return Math.max(0, h - 1);
    if (t === 'во время еды') return h;
    return h; // после еды – тот же час, но смещаем минуты
  };
  const timingMinute = (t: string) => t === 'после еды' ? 30 : 0;

  const medDates = (med: Med) => {
    const start = new Date(med.startDate + 'T00:00:00');
    return Array.from({ length: med.duration }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const pad = (n: number) => String(n).padStart(2, '0');
  const fmtICS = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

  const buildICS = (medsToExport: Med[]) => {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FamilyMed//RU'];
    medsToExport.forEach(med => {
      const total = parseInt(med.frequency as string) || 1;
      for (let i = 0; i < total; i++) {
        const start = new Date(med.startDate + 'T00:00:00');
        start.setHours(timingHour(med.timing, i, total), timingMinute(med.timing), 0, 0);
        const end = new Date(start.getTime() + 15 * 60000);
        lines.push(
          'BEGIN:VEVENT',
          `UID:${med.id}-${i}@familymed`,
          `DTSTAMP:${fmtICS(new Date())}`,
          `DTSTART:${fmtICS(start)}`,
          `DTEND:${fmtICS(end)}`,
          `RRULE:FREQ=DAILY;COUNT=${med.duration}`,
          `SUMMARY:💊 ${med.name} — ${getMember(med.memberId).name}`,
          `DESCRIPTION:Доза: ${med.dose} (${med.form})\\n${med.timing}\\nПрием ${i + 1} из ${total}`,
          'END:VEVENT'
        );
      }
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  };

  const downloadICS = (med?: Med) => {
    const ics = buildICS(med ? [med] : meds);
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = med ? `${med.name}.ics` : 'familymed-schedule.ics';
    a.click();
    URL.revokeObjectURL(url);
    showMessage('Календарь скачан (.ics)', 'success');
  };

  const googleCalendarUrl = (med: Med, doseIdx: number) => {
    const total = parseInt(med.frequency as string) || 1;
    const start = new Date(med.startDate + 'T00:00:00');
    start.setHours(timingHour(med.timing, doseIdx, total), timingMinute(med.timing), 0, 0);
    const end = new Date(start.getTime() + 15 * 60000);
    const dates = `${fmtICS(start)}/${fmtICS(end)}`;
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `💊 ${med.name} — ${getMember(med.memberId).name}`,
      dates,
      details: `Доза: ${med.dose} (${med.form})\n${med.timing}\nПрием ${doseIdx + 1} из ${total}`,
      recur: `RRULE:FREQ=DAILY;COUNT=${med.duration}`
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const addAllToGoogle = (med: Med) => {
    const total = parseInt(med.frequency as string) || 1;
    for (let i = 0; i < total; i++) {
      window.open(googleCalendarUrl(med, i), '_blank');
    }
  };

  // Calendar grid for current month
  const monthGrid = () => {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const startOffset = (first.getDay() + 6) % 7; // Mon = 0
    const days: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(y, m, d));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  };
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const medsOnDay = (date: Date) => (activeMemberId === 'all' ? meds : meds.filter(x => x.memberId === activeMemberId))
    .filter(med => medDates(med).some(d => sameDay(d, date)));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] antialiased pb-20 font-sans">
      <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-indigo-600 flex items-center justify-center md:justify-start gap-2">
              <Activity className="w-8 h-8" /> FamilyMed
            </h1>
            <p className="text-slate-500 text-sm font-medium">Забота о близких в одном приложении</p>
          </div>
          <nav className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
            <button
              onClick={() => setView('schedule')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${view === 'schedule' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <CalendarDays className="w-4 h-4" /> График
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${view === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <CalendarIcon className="w-4 h-4" /> Календарь
            </button>
            <button
              onClick={() => setView('shopping')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 relative ${view === 'shopping' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <ShoppingCart className="w-4 h-4" /> Аптека
              {shoppingList.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                  {shoppingList.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {view === 'schedule' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" /> Члены семьи
                  </h3>
                  <button onClick={() => setIsAddingMember(true)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveMemberId('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeMemberId === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}
                  >
                    Все
                  </button>
                  {family.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setActiveMemberId(m.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeMemberId === m.id ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${colors.find(c => c.name === m.color)?.bg}`} />
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-600" /> Новое назначение
                </h3>
                <form onSubmit={addMedication} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider px-1">Кому даем</label>
                    <select
                      className="w-full p-3 rounded-2xl border border-slate-100 bg-slate-50 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      value={formData.memberId}
                      onChange={e => setFormData({ ...formData, memberId: e.target.value })}
                    >
                      {family.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider px-1">Название</label>
                    <input
                      type="text" placeholder="Напр: Витамин Д" required
                      className="w-full p-3 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                      value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider px-1">Форма</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['таблетки', 'капли', 'порошок'] as MedForm[]).map(f => (
                        <button
                          type="button"
                          key={f}
                          onClick={() => setFormData({ ...formData, form: f })}
                          className={`py-2.5 rounded-2xl text-xs font-bold capitalize transition-all border ${
                            formData.form === f
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                              : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider px-1">
                        Доза ({formData.form === 'капли' ? 'кап.' : formData.form === 'порошок' ? 'пак.' : 'шт.'})
                      </label>
                      <input
                        type="number" step="0.5"
                        className="w-full p-3 rounded-2xl border border-slate-100 bg-slate-50 outline-none transition-all"
                        value={formData.dose} onChange={e => setFormData({ ...formData, dose: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider px-1">Раз в день</label>
                      <input
                        type="number" min="1" max="6"
                        className="w-full p-3 rounded-2xl border border-slate-100 bg-slate-50 outline-none transition-all"
                        value={formData.frequency} onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-[1.5rem] border border-amber-100">
                    <label className="text-[10px] font-bold uppercase text-amber-600 mb-1 block">
                      Всего в упаковке ({formData.form === 'капли' ? 'кап.' : formData.form === 'порошок' ? 'пак.' : 'шт.'})
                    </label>
                    <input
                      type="number"
                      className="w-full p-2.5 rounded-xl border border-amber-200 outline-none text-sm font-medium"
                      value={formData.totalInPackage} onChange={e => setFormData({ ...formData, totalInPackage: e.target.value })}
                    />
                  </div>

                  <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                    Добавить в список
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              {filteredMeds.length === 0 ? (
                <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                    <Pill className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-400">График пуст</h3>
                  <p className="text-slate-300 text-sm mt-1">Добавьте назначения для вашей семьи</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMeds.map(med => {
                    const member = getMember(med.memberId);
                    const colorObj = colors.find(c => c.name === member.color)!;
                    const daysLeft = getDaysLeft(med);
                    const isLow = daysLeft <= 3;
                    const stockPercent = (med.currentStock / med.initialStock) * 100;

                    return (
                      <div key={med.id} className={`bg-white rounded-[2.5rem] border transition-all ${isLow ? 'border-rose-200 shadow-md shadow-rose-50' : 'border-slate-100 shadow-sm'}`}>
                        <div className="p-6 md:p-8">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex gap-4 md:gap-6">
                              <div className={`${colorObj.light} ${colorObj.text} p-4 rounded-2xl h-fit`}>
                                <Pill className="w-7 h-7" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${colorObj.bg} text-white`}>
                                    {member.name}
                                  </span>
                                  <h3 className="font-bold text-xl text-slate-800">{med.name}</h3>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 flex-wrap">
                                  <span className="uppercase tracking-tighter px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">{med.form ?? 'таблетки'}</span>
                                  <span className={colorObj.text}>Доза: {med.dose} {med.form === 'капли' ? 'кап.' : med.form === 'порошок' ? 'пак.' : 'шт.'}</span>
                                  <span className="flex items-center gap-1 uppercase tracking-tighter"><Utensils className="w-3 h-3" /> {med.timing}</span>
                                </div>
                              </div>
                            </div>
                            <button onClick={() => deleteMed(med.id)} className="text-slate-200 hover:text-rose-500 p-2 transition-colors">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="mb-6 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-end mb-2">
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${isLow ? 'text-rose-500' : 'text-slate-400'}`}>
                                {isLow ? 'Запас критически мал!' : 'Остаток'}
                              </span>
                              <span className="text-xs font-black text-slate-600">
                                {med.currentStock} {med.form === 'капли' ? 'кап.' : med.form === 'порошок' ? 'пак.' : 'шт.'} <span className="text-slate-300 font-normal">/ {daysLeft} дн.</span>
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-1000 ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${stockPercent}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 md:gap-3">
                            {med.takenToday.map((isDone, i) => (
                              <button
                                key={i}
                                onClick={() => toggleDose(med.id, i)}
                                className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                                  isDone
                                    ? `${colorObj.bg} border-transparent text-white shadow-lg`
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                                }`}
                              >
                                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-md border-2 border-slate-200" />}
                                Прием {i + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5">
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
              <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Нужно купить</h2>
                  <p className="text-slate-400 text-sm">На основе ваших запасов в аптечке</p>
                </div>
                <ShoppingCart className="w-10 h-10 text-indigo-400" />
              </div>

              <div className="p-8">
                {shoppingList.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <p className="text-slate-500 font-medium">Ваша аптечка в полном порядке!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <button
                      onClick={copyShoppingList}
                      className="w-full bg-indigo-50 text-indigo-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all mb-4"
                    >
                      <Copy className="w-4 h-4" /> Скопировать список
                    </button>

                    <div className="space-y-3">
                      {shoppingList.map(med => {
                        const member = getMember(med.memberId);
                        const colorObj = colors.find(c => c.name === member.color)!;
                        return (
                          <div key={med.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-slate-100 group">
                            <div className="flex items-center gap-4">
                              <div className={`${colorObj.bg} w-10 h-10 rounded-xl flex items-center justify-center text-white`}>
                                <Pill className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800">{med.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                  Для: {member.name} • Остаток: {med.currentStock} шт.
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => replenishStock(med.id)}
                              className="text-emerald-600 bg-white border-2 border-emerald-50 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                            >
                              КУПИЛ(А)
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isAddingMember && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold mb-4">Новый профиль</h3>
              <input
                autoFocus
                type="text"
                placeholder="Имя ребенка или взрослого"
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 mb-6 outline-none focus:border-indigo-500 font-bold transition-all"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
              />
              <div className="flex flex-col gap-2">
                <button onClick={addMember} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                  Создать
                </button>
                <button onClick={() => setIsAddingMember(false)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {message.text && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl font-bold flex items-center gap-3 animate-in slide-in-from-bottom-10 border-b-4 border-indigo-500">
            <Check className="w-4 h-4 text-emerald-400" />
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyMedApp;
