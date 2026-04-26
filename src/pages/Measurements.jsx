import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BottomSheet from '../components/BottomSheet';

export default function Measurements() {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState('weight');

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    height: '',
    weight: '',
    bust: '',
    waist: '',
    hips: '',
    shoe_size: '',
    dress_size: '',
    notes: ''
  });

  const fetchMeasurements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    
    if (error) console.error(error);
    else setMeasurements(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchMeasurements();
  }, [user]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMeasurement = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('measurements').insert([
      {
        ...formData,
        user_id: user.id,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        bust: formData.bust ? parseFloat(formData.bust) : null,
        waist: formData.waist ? parseFloat(formData.waist) : null,
        hips: formData.hips ? parseFloat(formData.hips) : null,
        shoe_size: formData.shoe_size ? parseFloat(formData.shoe_size) : null,
      }
    ]);

    if (error) {
      alert('Erro ao salvar medidas: ' + error.message);
    } else {
      setIsAddModalOpen(false);
      fetchMeasurements();
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'), height: '', weight: '', bust: '', waist: '', hips: '', shoe_size: '', dress_size: '', notes: ''
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja realmente excluir esta medição?')) {
      const { error } = await supabase.from('measurements').delete().eq('id', id);
      if (!error) fetchMeasurements();
    }
  };

  const latest = measurements[0];
  const chartData = [...measurements].reverse().map(m => ({
    date: format(parseISO(m.date), 'dd/MM'),
    value: m[chartMetric]
  }));

  const metricsOptions = [
    { value: 'weight', label: 'Peso (kg)' },
    { value: 'bust', label: 'Busto (cm)' },
    { value: 'waist', label: 'Cintura (cm)' },
    { value: 'hips', label: 'Quadril (cm)' }
  ];

  return (
    <div className="min-h-full pb-20">
      <div className="sticky top-0 bg-brand-white border-b border-brand-border p-4 z-10">
        <h1 className="text-xl font-bold uppercase tracking-widest">Medidas</h1>
      </div>

      <div className="p-4 space-y-8">
        {/* Medida Mais Recente */}
        <div>
          <h2 className="text-[10px] uppercase tracking-widest text-brand-muted mb-2 font-bold">Mais Recente</h2>
          {latest ? (
            <div className="card bg-brand-black text-brand-white">
              <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-2">
                <span className="text-sm font-bold">{format(parseISO(latest.date), 'dd/MM/yyyy')}</span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-brand-gray mb-1">Peso</div>
                  <div className="font-bold">{latest.weight || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-brand-gray mb-1">Busto</div>
                  <div className="font-bold">{latest.bust || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-brand-gray mb-1">Cintura</div>
                  <div className="font-bold">{latest.waist || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-brand-gray mb-1">Quadril</div>
                  <div className="font-bold">{latest.hips || '-'}</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-brand-muted">Nenhuma medida registrada.</p>
          )}
        </div>

        {/* Gráfico */}
        {measurements.length > 1 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[10px] uppercase tracking-widest text-brand-muted font-bold flex items-center gap-1">
                <TrendingUp size={12} /> Evolução
              </h2>
              <select 
                value={chartMetric} 
                onChange={(e) => setChartMetric(e.target.value)}
                className="text-[10px] uppercase tracking-widest bg-transparent border border-brand-border p-1 outline-none"
              >
                {metricsOptions.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="card h-48 w-full p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#737373" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} stroke="#737373" tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '0', border: '1px solid #000' }} />
                  <Line type="monotone" dataKey="value" stroke="#000000" strokeWidth={2} dot={{ r: 4, fill: '#000' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Histórico */}
        <div>
          <h2 className="text-[10px] uppercase tracking-widest text-brand-muted mb-4 font-bold">Histórico</h2>
          <div className="space-y-4">
            {measurements.map(m => (
              <div key={m.id} className="card">
                <div className="flex justify-between items-start border-b border-brand-border pb-2 mb-2">
                  <span className="font-bold text-sm">{format(parseISO(m.date), 'dd/MM/yyyy')}</span>
                  <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>Busto: <b>{m.bust}</b></div>
                  <div>Cint: <b>{m.waist}</b></div>
                  <div>Quad: <b>{m.hips}</b></div>
                  <div>Peso: <b>{m.weight}</b></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-24 right-6 bg-brand-black text-brand-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform z-20"
      >
        <Plus size={24} />
      </button>

      <BottomSheet isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Nova Medição">
        <form onSubmit={handleAddMeasurement} className="space-y-4 pb-8">
          <div>
            <label className="label-text">Data *</label>
            <input type="date" name="date" required value={formData.date} onChange={handleFormChange} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Altura (cm)</label>
              <input type="number" step="0.1" name="height" value={formData.height} onChange={handleFormChange} className="input-field" placeholder="175" />
            </div>
            <div>
              <label className="label-text">Peso (kg)</label>
              <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleFormChange} className="input-field" placeholder="55" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-text">Busto (cm)</label>
              <input type="number" step="0.1" name="bust" value={formData.bust} onChange={handleFormChange} className="input-field" placeholder="85" />
            </div>
            <div>
              <label className="label-text">Cintura (cm)</label>
              <input type="number" step="0.1" name="waist" value={formData.waist} onChange={handleFormChange} className="input-field" placeholder="60" />
            </div>
            <div>
              <label className="label-text">Quadril (cm)</label>
              <input type="number" step="0.1" name="hips" value={formData.hips} onChange={handleFormChange} className="input-field" placeholder="90" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Número Sapato</label>
              <input type="number" step="0.5" name="shoe_size" value={formData.shoe_size} onChange={handleFormChange} className="input-field" placeholder="38" />
            </div>
            <div>
              <label className="label-text">Manequim</label>
              <input type="text" name="dress_size" value={formData.dress_size} onChange={handleFormChange} className="input-field" placeholder="36 / P" />
            </div>
          </div>
          <div>
            <label className="label-text">Observações</label>
            <textarea name="notes" value={formData.notes} onChange={handleFormChange} className="input-field h-20 resize-none"></textarea>
          </div>
          <button type="submit" className="btn-primary mt-6">Salvar Medidas</button>
        </form>
      </BottomSheet>
    </div>
  );
}
