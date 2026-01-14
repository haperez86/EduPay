import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/BranchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ButtonLoader } from '@/components/ui/LoadingSpinner';
import { GraduationCap, Eye, EyeOff, Building } from 'lucide-react';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [selectedBranch, setSelectedBranch] = useState('');
  const { register } = useAuth();
  const { branches, fetchBranches } = useBranch();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!selectedBranch) {
      setError('Debe seleccionar una sede para el rol de administrador');
      return;
    }

    setIsSubmitting(true);
    const success = await register({ 
      username, 
      password, 
      role: selectedRole,
      branchId: parseInt(selectedBranch)
    });
    setIsSubmitting(false);

    if (success) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12">
        <div className="text-center text-primary-foreground max-w-md">
          <GraduationCap className="w-20 h-20 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl font-bold mb-4">
            Únete a EduPay
          </h2>
          <p className="text-lg opacity-80">
            Crea tu cuenta y comienza a gestionar los pagos de tu institución 
            educativa de manera eficiente y organizada.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Crear cuenta</h1>
            <p className="text-muted-foreground mt-2">
              Regístrate para acceder al sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="Elige un nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <select
                id="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full h-11 px-3 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="ADMIN">Administrador de Sede</option>
                <option value="SUPER_ADMIN">Super Administrador</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">
                <Building className="w-4 h-4 inline mr-2" />
                Sede
              </Label>
              {branches.length === 0 ? (
                <div className="text-sm text-gray-500 p-2 border border-gray-200 rounded">
                  No hay sedes disponibles. Por favor, ejecute los scripts SQL para crear las sedes primero.
                </div>
              ) : (
                <select
                  id="branch"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full h-11 px-3 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  required
                >
                  <option value="">Selecciona una sede</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} {branch.isMain && '(Principal)'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 btn-primary font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? <ButtonLoader /> : 'Crear cuenta'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
