import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface AdminLoginFormData {
  email: string;
  password: string;
}

interface ForgotPasswordFormData {
  email: string;
}

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { register, handleSubmit, formState: { errors } } = useForm<AdminLoginFormData>();
  const { register: registerForgot, handleSubmit: handleSubmitForgot, formState: { errors: errorsForgot } } = useForm<ForgotPasswordFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const onSubmit = async (data: AdminLoginFormData) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE}/api/auth/login`, data, {
        withCredentials: true,
      });
      toast({
        title: "Succès",
        description: response.data.message,
      });
      navigate('/admin');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || 'Une erreur est survenue lors de la connexion',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPasswordSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE}/api/auth/forgot-password`, { email: data.email });
      toast({
        title: "Succès",
        description: response.data.message || 'Un e-mail de réinitialisation a été envoyé.',
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || 'Une erreur est survenue lors de la demande de réinitialisation',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Connexion au compte</CardTitle>
          <CardDescription>
            {showForgotPassword
              ? "Entrez votre e-mail pour recevoir un lien de réinitialisation du mot de passe"
              : "Entrez votre e-mail ci-dessous pour vous connecter à votre compte administrateur"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showForgotPassword ? (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    {...register("email", {
                      required: "L'e-mail est requis",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Adresse e-mail invalide",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm">{errors.email.message}</p>
                  )}
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:underline"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    {...register("password", {
                      required: "Le mot de passe est requis",
                      minLength: {
                        value: 3,
                        message: "Le mot de passe doit contenir au moins 3 caractères",
                      },
                    })}
                  />
                  {errors.password && (
                    <p className="text-red-600 text-sm">{errors.password.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Connexion..." : "Se connecter"}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitForgot(onForgotPasswordSubmit)}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="forgotEmail">E-mail</Label>
                  <Input
                    id="forgotEmail"
                    type="email"
                    placeholder="admin@example.com"
                    {...registerForgot("email", {
                      required: "L'e-mail est requis",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Adresse e-mail invalide",
                      },
                    })}
                  />
                  {errorsForgot.email && (
                    <p className="text-red-600 text-sm">{errorsForgot.email.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Retour à la connexion
                  </Button>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}