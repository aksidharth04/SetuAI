import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLocalization } from "../contexts/LocalizationContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    companyName: "",
    factoryLocation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: "" });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!form.name.trim()) {
      errors.name = t('auth.nameRequired');
    }
    
    if (!form.email.trim()) {
      errors.email = t('auth.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = t('auth.emailInvalid');
    }
    
    if (!form.password) {
      errors.password = t('auth.passwordRequired');
    } else if (form.password.length < 6) {
      errors.password = t('auth.passwordMinLength');
    }
    
    if (!form.companyName.trim()) {
      errors.companyName = t('auth.companyNameRequired');
    }
    
    if (!form.factoryLocation.trim()) {
      errors.factoryLocation = t('auth.factoryLocationRequired');
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    if (!validateForm()) {
      setLoading(false);
      return;
    }
    
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.error || t('auth.registrationFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <motion.h2 
            className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {t('auth.vendorRegistration')}
          </motion.h2>
          
          {error && (
            <motion.div 
              className="mb-4 p-3 text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {error}
            </motion.div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.name')} *
              </label>
              <input
                type="text"
                name="name"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  validationErrors.name 
                    ? 'border-red-500 dark:border-red-400' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                value={form.name}
                onChange={handleChange}
                placeholder={t('auth.namePlaceholder')}
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.name}</p>
              )}
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.email')} *
              </label>
              <input
                type="email"
                name="email"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  validationErrors.email 
                    ? 'border-red-500 dark:border-red-400' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                value={form.email}
                onChange={handleChange}
                placeholder={t('auth.emailPlaceholder')}
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.email}</p>
              )}
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.password')} *
              </label>
              <input
                type="password"
                name="password"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  validationErrors.password 
                    ? 'border-red-500 dark:border-red-400' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                value={form.password}
                onChange={handleChange}
                placeholder={t('auth.passwordPlaceholder')}
              />
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.password}</p>
              )}
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.companyName')} *
              </label>
              <input
                type="text"
                name="companyName"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  validationErrors.companyName 
                    ? 'border-red-500 dark:border-red-400' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                value={form.companyName}
                onChange={handleChange}
                placeholder={t('auth.companyNamePlaceholder')}
              />
              {validationErrors.companyName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.companyName}</p>
              )}
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.factoryLocation')} *
              </label>
              <input
                type="text"
                name="factoryLocation"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  validationErrors.factoryLocation 
                    ? 'border-red-500 dark:border-red-400' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                value={form.factoryLocation}
                onChange={handleChange}
                placeholder={t('auth.factoryLocationPlaceholder')}
              />
              {validationErrors.factoryLocation && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.factoryLocation}</p>
              )}
            </div>
          </div>
          
          <motion.button
            type="submit"
            disabled={loading}
            className={`w-full mt-6 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
              loading 
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            } text-white shadow-md hover:shadow-lg`}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {t('auth.registering')}
              </div>
            ) : (
              t('auth.register')
            )}
          </motion.button>
          
          <div className="mt-6 text-center">
            <span className="text-gray-600 dark:text-gray-400">{t('auth.alreadyHaveAccount')} </span>
            <Link 
              to="/login" 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium transition-colors"
            >
              {t('auth.signIn')}
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
} 