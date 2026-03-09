import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { TrainFront, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/');
      } else {
        setError('用户名或密码错误 (默认: admin / 123456)');
      }
    } catch (err) {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f5fa] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-[#0056b3] skew-y-[-5deg] origin-top-left transform -translate-y-20 z-0"></div>
      <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-gradient-to-tl from-[#0099cc]/10 to-transparent rounded-full blur-3xl z-0"></div>

      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden z-10 relative animate-in fade-in zoom-in duration-500">
        <div className="p-8 text-center bg-[#0056b3] text-white">
          <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4">
            <TrainFront className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1">路桥通</h1>
          <p className="text-blue-100 text-sm">成都路桥AI大模型助手平台</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">账号</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#0056b3]/20 outline-none transition-all"
                placeholder="请输入账号"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#0056b3]/20 outline-none transition-all"
                placeholder="请输入密码"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0056b3] hover:bg-[#004494] text-white font-semibold rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '立即登录'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs text-slate-400">
            © 2026 中国中铁 · 技术支持
          </div>
        </div>
      </div>
    </div>
  );
}
