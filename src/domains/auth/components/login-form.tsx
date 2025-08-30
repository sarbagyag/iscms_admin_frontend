'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  TextInput,
  PasswordInput,
  Button,
  Checkbox,
  InlineNotification,
} from '@carbon/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/routing';
import { useLogin } from '@/hooks/queries/use-auth-queries';
import { LoginCredentials } from '@/types/auth';
import { EnglishOnlyText } from '@/shared/components/english-only-text';
import '@/domains/auth/styles/auth.css';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const t = useTranslations('auth');
  const router = useRouter();
  const loginMutation = useLogin();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setShowError(false);
      setErrorMessage('');
      
      const credentials: LoginCredentials = {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      };

      console.log('🔐 Login Flow Step 1: Starting login with credentials:', { 
        email: credentials.email, 
        rememberMe: credentials.rememberMe 
      });
      
      console.log('🔐 Login Flow Step 2: Calling loginMutation.mutateAsync...');
      const result = await loginMutation.mutateAsync(credentials);
      console.log('🔐 Login Flow Step 3: Login mutation completed successfully:', result);
      
      console.log('🔐 Login Flow Step 4: Login successful, redirecting to dashboard');
      console.log('🔐 Router details:', {
        currentPath: window.location.pathname,
        targetPath: '/admin/dashboard'
      });
      
      // Redirect to dashboard on successful login
      try {
        await router.push('/admin/dashboard');
        console.log('🔐 Login Flow Step 5: Navigation completed successfully');
      } catch (navError) {
        console.error('🚨 Navigation error:', navError);
        // Fallback navigation
        console.log('🔐 Attempting fallback navigation...');
        window.location.href = '/admin/dashboard';
      }
    } catch (error) {
      console.error('🚨 Login Flow Failed at step:', error);
      console.error('🚨 Login error details:', error);
      console.error('🚨 Error type:', typeof error);
      console.error('🚨 Error constructor:', error?.constructor?.name);
      console.error('🚨 Error stringified:', JSON.stringify(error, null, 2));
      
      setShowError(true);
      
      // Handle specific error types
      if (error && typeof error === 'object') {
        let message = t('errors.serverError');
        
        // Check if it's an axios error
        if ('response' in error && error.response) {
          const response = error.response as { status: number; data?: { error?: { message?: string } } };
          console.log('🚨 Axios error response:', response);
          
          if (response.status === 404) {
            message = 'API endpoint not found. Please check if the mock server is running.';
          } else if (response.status === 401) {
            message = t('errors.invalidCredentials');
          } else if (response.status === 429) {
            message = t('errors.rateLimited');
          } else if (response.data?.error?.message) {
            message = response.data.error.message;
          }
        } 
        // Check if it's our custom error format
        else if ('message' in error && typeof error.message === 'string') {
          const errorMessage = error.message;
          console.log('🚨 Error message:', errorMessage);
          
          if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
            message = t('errors.rateLimited');
          } else if (errorMessage.includes('invalid') || errorMessage.includes('unauthorized')) {
            message = t('errors.invalidCredentials');
          } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
            message = t('errors.networkError');
          } else {
            message = errorMessage;
          }
        }
        // Check if it's an object with error property
        else if ('error' in error && error.error) {
          const errorObj = error.error as { message?: string };
          if (errorObj.message) {
            message = errorObj.message;
          }
        }
        
        setErrorMessage(message);
        setError('root', { 
          type: 'manual', 
          message 
        });
      } else {
        // Fallback for unknown error types
        const fallbackMessage = t('errors.serverError');
        setErrorMessage(fallbackMessage);
        setError('root', { 
          type: 'manual', 
          message: fallbackMessage
        });
      }
    }
  };

  return (
    <div className="login-form-container">
      <Form onSubmit={handleSubmit(onSubmit)}>
        {/* Main Title */}
        <div className="login-form-header">
          <h1 className="login-form-title">
            {t('title')}
          </h1>
          <p className="login-form-subtitle">
            {t('subtitle')}
          </p>
        </div>

        {/* Error Notification */}
        {showError && (errors.root || errorMessage) && (
          <InlineNotification
            kind="error"
            title="Login Failed"
            subtitle={errors.root?.message || errorMessage}
            hideCloseButton
            lowContrast
            className="login-form-error"
          />
        )}

        {/* Form Fields */}
        <div className="login-form-content">
          <div className="login-form-fields">
            {/* Email Input */}
            <div className="login-form-field font-english-only">
              <TextInput
                id="email"
                labelText={t('form.email.label')}
                placeholder={t('form.email.placeholder')}
                invalid={!!errors.email}
                invalidText={errors.email?.message}
                size="lg"
                {...register('email')}
              />
            </div>

            {/* Password Input */}
            <div className="login-form-field">
              <PasswordInput
                id="password"
                labelText={t('form.password.label')}
                placeholder={t('form.password.placeholder')}
                invalid={!!errors.password}
                invalidText={errors.password?.message}
                size="lg"
                {...register('password')}
              />
            </div>

            {/* Remember Me Checkbox */}
            <div className="login-form-checkbox">
              <Checkbox
                id="rememberMe"
                labelText={t('form.rememberMe')}
                {...register('rememberMe')}
              />
            </div>

            {/* Sign In Button */}
            <div>
              <Button
                type="submit"
                kind="primary"
                size="lg"
                disabled={isSubmitting || loginMutation.isPending}
                className="login-form-submit"
              >
                {isSubmitting || loginMutation.isPending 
                  ? 'Signing in...' 
                  : t('actions.signIn')
                }
              </Button>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="login-form-footer">
          <div className="login-form-footer-content">
            <p className="login-form-forgot-text">{t('sections.forgotPassword')}</p>
            <button
              type="button"
              className="login-form-forgot-link"
            >
              {t('actions.contactHelp')}
            </button>
          </div>
        </div>
      </Form>
    </div>
  );
}; 