import React, { useState, useEffect } from 'react';
import { LogOut, Upload, User, MapPin, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    agency: '',
    phone: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error(error);
      } else if (data) {
        setProfile(data);
      }
      setLoading(false);
    }

    if (user) fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      name: profile.name,
      agency: profile.agency,
      phone: profile.phone,
      avatar_url: profile.avatar_url
    });

    if (error) alert('Erro ao salvar perfil: ' + error.message);
    else alert('Perfil salvo com sucesso!');
    setSaving(false);
  };

  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      setProfile(prev => ({ ...prev, avatar_url: data.publicUrl }));
    } catch (error) {
      alert('Erro no upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-full pb-20">
      <div className="sticky top-0 bg-brand-white border-b border-brand-border p-4 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold uppercase tracking-widest">Perfil</h1>
        <button onClick={handleLogout} className="text-brand-muted hover:text-brand-black flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold">
          Sair <LogOut size={16} />
        </button>
      </div>

      <div className="p-4 space-y-8">
        {/* Cartão de Apresentação (Compartilhável) */}
        <div className="bg-brand-black text-brand-white p-6 relative overflow-hidden flex flex-col items-center text-center space-y-4">
          <div className="pt-2">
            <h2 className="text-xl font-bold uppercase tracking-widest">{profile.name || 'Seu Nome'}</h2>
            <p className="text-sm tracking-widest text-brand-gray/70 mt-1">{profile.agency || 'Sua Agência'}</p>
          </div>
          <div className="pt-4 border-t border-brand-white/20 w-full flex justify-center gap-4 text-xs font-medium tracking-widest">
            {profile.phone && <span className="flex items-center gap-1"><Phone size={14} /> {profile.phone}</span>}
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="flex flex-col items-center">
            <label className="cursor-pointer group flex flex-col items-center">
              <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-widest text-[10px] hover:text-blue-800 transition-colors">
                <Upload size={14} />
                {uploading ? 'Enviando...' : 'Alterar Foto'}
              </div>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          <div>
            <label className="label-text">Nome Completo</label>
            <input 
              type="text" 
              name="name" 
              value={profile.name} 
              onChange={handleFormChange} 
              className="input-field" 
              placeholder="Digite seu nome"
            />
          </div>
          <div>
            <label className="label-text">Agência</label>
            <input 
              type="text" 
              name="agency" 
              value={profile.agency} 
              onChange={handleFormChange} 
              className="input-field" 
              placeholder="Sua agência atual"
            />
          </div>
          <div>
            <label className="label-text">Telefone / WhatsApp</label>
            <input 
              type="tel" 
              name="phone" 
              value={profile.phone} 
              onChange={handleFormChange} 
              className="input-field" 
              placeholder="(00) 00000-0000"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Perfil'}
          </button>
        </form>
      </div>
    </div>
  );
}
