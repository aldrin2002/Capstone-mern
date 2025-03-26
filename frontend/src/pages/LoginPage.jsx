import { useState } from "react";
import { Mail, Lock, Loader } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import { useAuthStore } from "../store/authStore";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const { login, isLoading, error } = useAuthStore();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            toast.success("Logged in successfully!");
            navigate("/");
        } catch (error) {
            toast.error("Failed to login");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-700'
        >
            <div className='max-w-md w-full mx-4 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg overflow-hidden border border-gray-200'>
                <div className='p-8'>
                    <h2 className='text-3xl font-bold mb-6 text-center text-white'>
                        Welcome Admin!
                    </h2>
                    <div className='h-1 w-20 bg-blue-500 mx-auto mb-8'></div>

                    <form onSubmit={handleLogin}>
                        <Input
                            icon={Mail}
                            type='email'
                            placeholder='Email Address'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <Input
                            icon={Lock}
                            type='password'
                            placeholder='Password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {error && <p className='text-red-500 font-semibold mb-4'>{error}</p>}

                        <button
                            className='w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200'
                            type='submit'
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader className='w-6 h-6 animate-spin mx-auto' /> : "Login"}
                        </button>
                    </form>
                </div>
                <div className='px-8 py-4 bg-gray-50 bg-opacity-20 flex justify-center'>
                    <p className='text-sm text-white'>
                        Don't have an account?{" "}
                        <Link to='/signup' className='text-blue-300 font-medium hover:underline'>
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default LoginPage;