import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, isSameMonth, parseISO, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Finance() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('todos'); // todos, pendente, recebido, atrasado
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)
      .not('value', 'is', null)
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

  const markAsReceived = async (id) => {
    const { error } = await supabase.from('jobs').update({ status: 'concluído' }).eq('id', id);
    if (!error) fetchJobs();
  };

  const today = startOfDay(new Date());

  const getJobPaymentStatus = (job) => {
    if (job.status === 'concluído') return 'recebido';
    if (job.payment_date && isBefore(parseISO(job.payment_date), today)) return 'atrasado';
    return 'pendente';
  };

  const monthJobs = jobs.filter(job => isSameMonth(parseISO(job.date), currentMonth));
  
  const stats = monthJobs.reduce((acc, job) => {
    const status = getJobPaymentStatus(job);
    const val = parseFloat(job.value) || 0;
    acc.total += val;
    if (status === 'recebido') acc.received += val;
    if (status === 'pendente') acc.pending += val;
    if (status === 'atrasado') acc.overdue += val;
    return acc;
  }, { total: 0, received: 0, pending: 0, overdue: 0 });

  const progressPercent = stats.total > 0 ? (stats.received / stats.total) * 100 : 0;

  const filteredJobs = monthJobs.filter(job => {
    if (filter === 'todos') return true;
    return getJobPaymentStatus(job) === filter;
  });

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="min-h-full pb-20">
      <div className="sticky top-0 bg-brand-white border-b border-brand-border p-4 z-10">
        <h1 className="text-xl font-bold uppercase tracking-widest mb-4">Finanças</h1>
        <div className="flex justify-between items-center">
          <button onClick={handlePrevMonth} className="p-2"><ChevronLeft size={20} /></button>
          <span className="uppercase tracking-widest font-bold text-sm">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button onClick={handleNextMonth} className="p-2"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Resumo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card bg-brand-black text-brand-white col-span-2">
            <h3 className="text-[10px] uppercase tracking-widest text-brand-gray mb-1">Total do Mês</h3>
            <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
            
            <div className="mt-4">
              <div className="flex justify-between text-[10px] uppercase tracking-widest mb-1">
                <span>Progresso</span>
                <span>{progressPercent.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-brand-white h-full" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-[10px] uppercase tracking-widest text-brand-muted mb-1 flex items-center gap-1">
              <CheckCircle2 size={12} /> Recebido
            </h3>
            <p className="text-lg font-bold">{formatCurrency(stats.received)}</p>
          </div>
          
          <div className="card">
            <h3 className="text-[10px] uppercase tracking-widest text-brand-muted mb-1 flex items-center gap-1">
              <Clock size={12} /> A Receber
            </h3>
            <p className="text-lg font-bold">{formatCurrency(stats.pending)}</p>
          </div>
          
          <div className="card border-red-200 col-span-2">
            <h3 className="text-[10px] uppercase tracking-widest text-red-500 mb-1 flex items-center gap-1">
              <AlertCircle size={12} /> Atrasado
            </h3>
            <p className="text-lg font-bold text-red-600">{formatCurrency(stats.overdue)}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['todos', 'pendente', 'recebido', 'atrasado'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-[10px] uppercase tracking-widest whitespace-nowrap transition-colors border ${
                filter === f 
                  ? 'bg-brand-black text-brand-white border-brand-black' 
                  : 'bg-brand-white text-brand-black border-brand-border'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Lista de Trabalhos */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <p className="text-sm text-center text-brand-muted py-8">Nenhum trabalho encontrado.</p>
          ) : (
            filteredJobs.map(job => {
              const status = getJobPaymentStatus(job);
              return (
                <div key={job.id} className="card flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold uppercase tracking-widest text-sm">{job.title}</h4>
                      <p className="text-xs text-brand-muted">{format(parseISO(job.date), 'dd/MM/yyyy')}</p>
                    </div>
                    <p className="font-bold">{formatCurrency(job.value)}</p>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-widest text-brand-muted">
                        Pgto: {job.payment_date ? format(parseISO(job.payment_date), 'dd/MM/yyyy') : 'Não definido'}
                      </span>
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-1 font-semibold inline-block self-start ${
                        status === 'recebido' ? 'bg-green-100 text-green-800' :
                        status === 'atrasado' ? 'bg-red-100 text-red-800' :
                        'bg-brand-gray text-brand-black'
                      }`}>
                        {status}
                      </span>
                    </div>
                    {status !== 'recebido' && (
                      <button 
                        onClick={() => markAsReceived(job.id)}
                        className="text-[10px] uppercase tracking-widest border border-brand-black px-3 py-2 active:bg-brand-gray"
                      >
                        Marcar Recebido
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
