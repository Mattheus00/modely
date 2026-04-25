import React, { useState, useEffect } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, parseISO, addDays, isWithinInterval, startOfDay 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, List as ListIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BottomSheet from '../components/BottomSheet';

const JOB_TYPES_COLORS = {
  'Editorial': 'bg-blue-400',
  'Campanha': 'bg-purple-400',
  'Runway': 'bg-pink-400',
  'Digital': 'bg-cyan-400',
  'Evento': 'bg-orange-400',
  'Catálogo': 'bg-emerald-400',
  'Publicidade': 'bg-indigo-400',
  'Teste': 'bg-gray-400',
  'Showroom': 'bg-rose-400',
  'Fit Model': 'bg-amber-400',
  'E-commerce': 'bg-teal-400',
  'Agenda Fechada': 'bg-red-600',
  'Outro': 'bg-neutral-400'
};

const JOB_TYPES = Object.keys(JOB_TYPES_COLORS);

export default function Agenda() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('calendar'); // 'calendar' | 'list'
  const [jobs, setJobs] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    client: '',
    job_type: 'Editorial',
    date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    call_time: '',
    end_time: '',
    location: '',
    value: '',
    payment_delay_days: 90,
    status: 'agendado',
    notes: ''
  });

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });
    
    if (error) console.error(error);
    else setJobs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchJobs();
  }, [user]);

  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const daysInterval = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const weekDaysHeader = (
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((wd, i) => (
          <div key={i} className="text-center text-[10px] uppercase tracking-widest text-brand-muted font-bold">
            {wd}
          </div>
        ))}
      </div>
    );

    let i = 0;
    while (i < daysInterval.length) {
      for (let j = 0; j < 7; j++) {
        const cloneDay = daysInterval[i];
        formattedDate = format(cloneDay, dateFormat);
        const dayJobs = jobs.filter(job => {
          const start = startOfDay(parseISO(job.date));
          const end = job.end_date ? startOfDay(parseISO(job.end_date)) : start;
          return isSameDay(cloneDay, start) || isSameDay(cloneDay, end) || (cloneDay >= start && cloneDay <= end);
        });
        const isSelected = isSameDay(cloneDay, selectedDate);
        const inMonth = isSameMonth(cloneDay, monthStart);

        days.push(
          <div 
            key={cloneDay.toISOString()} 
            onClick={() => setSelectedDate(cloneDay)}
            className={`p-2 flex flex-col items-center justify-center cursor-pointer h-12 w-12 mx-auto rounded-full transition-colors ${
              !inMonth ? 'text-brand-border' : 
              isSelected ? 'bg-brand-black text-brand-white' : 'text-brand-black hover:bg-brand-gray'
            }`}
          >
            <span className="text-sm">{formattedDate}</span>
            <div className="flex gap-0.5 mt-1 h-1">
              {dayJobs.slice(0, 3).map((job, idx) => (
                <div 
                  key={job.id || idx} 
                  className={`w-1 h-1 rounded-full ${isSelected ? 'bg-brand-white' : (JOB_TYPES_COLORS[job.job_type] || 'bg-brand-black')}`} 
                />
              ))}
              {dayJobs.length > 3 && (
                <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-brand-white' : 'bg-brand-black'}`} />
              )}
            </div>
          </div>
        );
        i++;
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1 mb-1" key={day.toISOString()}>
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6 px-4">
          <button onClick={handlePrevMonth} className="p-2"><ChevronLeft size={20} /></button>
          <span className="uppercase tracking-widest font-bold text-sm">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button onClick={handleNextMonth} className="p-2"><ChevronRight size={20} /></button>
        </div>
        {weekDaysHeader}
        {rows}
      </div>
    );
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculatePaymentDate = (dateStr, delayDays) => {
    if (!dateStr || delayDays === '') return '';
    const d = parseISO(dateStr);
    return format(addDays(d, parseInt(delayDays) || 0), 'yyyy-MM-dd');
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    const paymentDate = calculatePaymentDate(formData.date, formData.payment_delay_days);
    
    const { error } = await supabase.from('jobs').insert([
      {
        ...formData,
        user_id: user.id,
        value: formData.value ? parseFloat(formData.value) : null,
        payment_date: paymentDate
      }
    ]);

    if (error) {
      alert('Erro ao adicionar trabalho: ' + error.message);
    } else {
      setIsAddModalOpen(false);
      fetchJobs();
      setFormData({
        title: '', client: '', job_type: 'Editorial', date: format(new Date(), 'yyyy-MM-dd'), end_date: '',
        call_time: '', end_time: '', location: '', value: '', payment_delay_days: 90, status: 'agendado', notes: ''
      });
    }
  };

  const selectedJobs = jobs.filter(job => {
    const start = startOfDay(parseISO(job.date));
    const end = job.end_date ? startOfDay(parseISO(job.end_date)) : start;
    return isSameDay(selectedDate, start) || isSameDay(selectedDate, end) || (selectedDate >= start && selectedDate <= end);
  });

  return (
    <div className="min-h-full pb-20">
      <div className="sticky top-0 bg-brand-white border-b border-brand-border p-4 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold uppercase tracking-widest">Agenda</h1>
        <div className="flex gap-2">
          <button onClick={() => setView('calendar')} className={`p-2 ${view === 'calendar' ? 'text-brand-black' : 'text-brand-muted'}`}><CalendarIcon size={20} /></button>
          <button onClick={() => setView('list')} className={`p-2 ${view === 'list' ? 'text-brand-black' : 'text-brand-muted'}`}><ListIcon size={20} /></button>
        </div>
      </div>

      <div className="p-4">
        {view === 'calendar' ? (
          <>
            {renderCalendar()}
            <div className="mt-8">
              <h3 className="text-xs uppercase tracking-widest font-bold text-brand-muted mb-4 border-b border-brand-border pb-2">
                Trabalhos do Dia - {format(selectedDate, 'dd/MM/yyyy')}
              </h3>
              {selectedJobs.length === 0 ? (
                <p className="text-sm text-center text-brand-muted py-8">Nenhum trabalho agendado.</p>
              ) : (
                <div className="space-y-4">
                  {selectedJobs.map(job => (
                    <div key={job.id} className="card flex flex-col gap-2 relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${JOB_TYPES_COLORS[job.job_type] || 'bg-brand-black'}`} />
                      <div className="flex justify-between items-start pl-2">
                        <h4 className="font-bold uppercase tracking-widest text-sm">{job.title}</h4>
                        <span className="text-[10px] uppercase tracking-widest bg-brand-gray px-2 py-1 font-semibold border border-brand-border">{job.status}</span>
                      </div>
                      <div className="pl-2">
                        <p className="text-sm text-brand-muted">{job.client} • {job.job_type}</p>
                        {(job.call_time || job.location) && (
                          <p className="text-xs font-medium mt-2">
                            {job.call_time && `Call: ${job.call_time} `}
                            {job.location && `| Local: ${job.location}`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
             {jobs.length === 0 ? (
                <p className="text-sm text-center text-brand-muted py-8">Nenhum trabalho agendado.</p>
             ) : (
                jobs.map(job => (
                  <div key={job.id} className="card flex flex-col gap-2 relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${JOB_TYPES_COLORS[job.job_type] || 'bg-brand-black'}`} />
                    <div className="flex justify-between items-start pl-2">
                      <h4 className="font-bold uppercase tracking-widest text-sm">{job.title}</h4>
                      <span className="text-xs font-semibold">{format(parseISO(job.date), 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="pl-2">
                       <p className="text-sm text-brand-muted">{job.client} • {job.job_type}</p>
                       <span className="text-[10px] self-start uppercase tracking-widest border border-brand-border px-2 py-1 font-semibold mt-2">{job.status}</span>
                    </div>
                  </div>
                ))
             )}
          </div>
        )}
      </div>

      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-24 right-6 bg-brand-black text-brand-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform z-20"
      >
        <Plus size={24} />
      </button>

      <BottomSheet isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Novo Trabalho">
        <form onSubmit={handleAddJob} className="space-y-4 pb-8">
          <div>
            <label className="label-text">Título *</label>
            <input type="text" name="title" required value={formData.title} onChange={handleFormChange} className="input-field" placeholder="Ex: Shooting Verão" />
          </div>
          <div>
            <label className="label-text">Cliente / Marca</label>
            <input type="text" name="client" value={formData.client} onChange={handleFormChange} className="input-field" placeholder="Ex: Vogue" />
          </div>
          <div>
            <label className="label-text">Tipo de Trabalho</label>
            <select name="job_type" value={formData.job_type} onChange={handleFormChange} className="input-field bg-brand-white">
              {JOB_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">Data Início *</label>
              <input type="date" name="date" required value={formData.date} onChange={handleFormChange} className="input-field" />
            </div>
            <div>
              <label className="label-text">Data Término (Opcional)</label>
              <input type="date" name="end_date" value={formData.end_date} onChange={handleFormChange} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">Horário de Call</label>
              <input type="time" name="call_time" value={formData.call_time} onChange={handleFormChange} className="input-field" />
            </div>
            <div>
              <label className="label-text">Horário de Término</label>
              <input type="time" name="end_time" value={formData.end_time} onChange={handleFormChange} className="input-field" />
            </div>
          </div>
          <div>
            <label className="label-text">Local / Endereço</label>
            <input type="text" name="location" value={formData.location} onChange={handleFormChange} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">Valor (R$)</label>
              <input type="number" step="0.01" name="value" value={formData.value} onChange={handleFormChange} className="input-field" placeholder="0.00" />
            </div>
            <div>
              <label className="label-text">Prazo Pgto (Dias)</label>
              <input type="number" name="payment_delay_days" value={formData.payment_delay_days} onChange={handleFormChange} className="input-field" />
            </div>
          </div>
          {formData.date && formData.payment_delay_days !== '' && (
            <div className="text-[10px] uppercase tracking-widest text-brand-muted">
              Data de pagamento calculada: <span className="font-bold text-brand-black">{format(parseISO(calculatePaymentDate(formData.date, formData.payment_delay_days)), 'dd/MM/yyyy')}</span>
            </div>
          )}
          <div>
            <label className="label-text">Status</label>
            <select name="status" value={formData.status} onChange={handleFormChange} className="input-field bg-brand-white">
              {['agendado', 'confirmado', 'concluído', 'cancelado'].map(s => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">Observações</label>
            <textarea name="notes" value={formData.notes} onChange={handleFormChange} className="input-field h-24 resize-none" placeholder="Detalhes do job..."></textarea>
          </div>
          <button type="submit" className="btn-primary mt-6">Salvar Trabalho</button>
        </form>
      </BottomSheet>
    </div>
  );
}
