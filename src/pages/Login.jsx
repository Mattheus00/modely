import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Verifique seu email para confirmar o cadastro!');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="Modelly Logo" className="h-28 w-auto object-contain" />
        </div>
        <h1 className="text-xl font-bold uppercase tracking-widest text-center mb-8">
          {isLogin ? 'Entrar' : 'Cadastrar'}
        </h1>
        {error && <div className="text-red-500 text-xs uppercase tracking-widest mb-4 text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label-text">Email</label>
            <input 
              type="email" 
              className="input-field" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label-text">Senha</label>
            <input 
              type="password" 
              className="input-field" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>
        <button 
          onClick={() => setIsLogin(!isLogin)} 
          className="w-full mt-6 text-xs uppercase tracking-widest text-brand-muted hover:text-brand-black transition-colors"
        >
          {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
        </button>
      </div>
    </div>
  );
}
