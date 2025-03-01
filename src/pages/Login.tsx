import { Button } from '../components';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../contexts/SupabaseContext';

export default function Login() {
    const { supabaseAuth } = useSupabase();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabaseAuth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            navigate('/');
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSignUp(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabaseAuth.signUp({
                email,
                password,
            });

            if (error) throw error;
            setError('Check your email for the confirmation link.');
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="relative w-full max-w-md transform transition-all duration-300 hover:scale-[1.01]">
                {/* Decorative elements */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 rounded-3xl blur-2xl opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 transform skew-y-6 sm:skew-y-0 sm:rotate-6 rounded-3xl blur-2xl opacity-40"></div>
                
                {/* Main card */}
                <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl rounded-3xl p-8 space-y-6 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="space-y-2 text-center">
                        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            GearShift
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Sign in to manage your car expenses
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="p-4 rounded-xl bg-red-50/50 backdrop-blur-sm border border-red-100 dark:bg-red-900/20 dark:border-red-800/50">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email address
                                </label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 placeholder-gray-400 text-gray-900 dark:text-gray-100 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="block w-full px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 placeholder-gray-400 text-gray-900 dark:text-gray-100 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                variant="default"
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </Button>
                            <Button
                                type="button"
                                disabled={loading}
                                onClick={handleSignUp}
                                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500/20 transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                variant="default"
                            >
                                {loading ? 'Signing up...' : 'Sign up'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
