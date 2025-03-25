import { Loader, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { useAuthStore } from "../store/authStore";
import { toast } from "react-hot-toast";

const SignUpPage = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const { signup, error, isLoading } = useAuthStore();

    const handleSignUp = async (e) => {
        e.preventDefault();

        try {
            await signup(email, password, name);
            toast.success("Account created successfully!");
            navigate("/"); // Navigate to homepage or dashboard
        } catch (error) {
            console.log(error);
            toast.error("Failed to create account");
        }
    };
    
    return (
        <div className='max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200'>
            <div className='p-8'>
                <h2 className='text-3xl font-bold mb-6 text-center text-gray-800'>
                    Create Account
                </h2>
                <div className='h-1 w-20 bg-blue-500 mx-auto mb-8'></div>

                <form onSubmit={handleSignUp}>
                    <Input
                        icon={User}
                        type='text'
                        placeholder='Full Name'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
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
                    {error && <p className='text-red-500 font-semibold mt-2 mb-2'>{error}</p>}
                    <PasswordStrengthMeter password={password} />

                    <button
                        className='mt-5 w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md 
                        hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        transition duration-200'
                        type='submit'
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader className='animate-spin mx-auto' size={24} /> : "Sign Up"}
                    </button>
                </form>
            </div>
            <div className='px-8 py-4 bg-gray-50 flex justify-center'>
                <p className='text-sm text-gray-600'>
                    Already have an account?{" "}
                    <Link to={"/login"} className='text-blue-600 font-medium hover:underline'>
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignUpPage;