import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ username, password });
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message 
        || err.message 
        || (err.response?.status === 0 ? 'Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không.' 
        : 'Đăng nhập thất bại');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card className="p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-text font-heading">
            Đăng nhập
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Tên đăng nhập"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
            
            <Input
              label="Mật khẩu"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
