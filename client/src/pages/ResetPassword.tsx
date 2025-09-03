import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export function ResetPassword({ className, ...props }: React.ComponentProps<"div">) {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetPasswordFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get('token');

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE}/api/auth/reset-password`, {
        token,
        newPassword: data.newPassword,
      });
      toast({
        title: "Succès",
        description: response.data.message || 'Mot de passe réinitialisé avec succès.',
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 max-w-md mx-auto mt-24", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Réinitialiser le mot de passe</CardTitle>
          <CardDescription>
            Entrez votre nouveau mot de passe ci-dessous pour réinitialiser votre compte administrateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...register("newPassword", {
                    required: "Le mot de passe est requis",
                    minLength: {
                      value: 3,
                      message: "Le mot de passe doit contenir au moins 3 caractères",
                    },
                  })}
                />
                {errors.newPassword && (
                  <p className="text-red-600 text-sm">{errors.newPassword.message}</p>
                )}
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword", {
                    required: "La confirmation du mot de passe est requise",
                  })}
                />
                {errors.confirmPassword && (
                  <p className="text-red-600 text-sm">{errors.confirmPassword.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading || !token}>
                  {isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}