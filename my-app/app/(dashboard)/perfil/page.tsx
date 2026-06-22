"use client";

import { useState } from "react";
import { Shield, Key, Activity, Clock } from "lucide-react";
import TopBar from "@/components/TopBar";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export default function PerfilPage() {
  const { user } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (newPassword.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setSaving(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      setSuccess("Senha alterada com sucesso!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setSuccess("");
      }, 2000);
    } catch {
      setError("Erro ao alterar senha. Verifique sua senha atual.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="clip rounded-[32px] bg-white p-8 flex flex-col gap-5 h-full overflow-hidden">
      <TopBar
        title="Perfil de usuário"
        subtitle="Dados de acesso, papel e preferências do sistema."
        showSearch={false}
        showNewSale={false}
      />

      <div className="flex-1 bg-[#F8F6F4] rounded-[28px] p-6 flex gap-6 overflow-auto">
        <div className="w-[120px] h-[120px] bg-[#FFDAD8] rounded-[28px] flex items-center justify-center">
          <div className="w-16 h-16 bg-white rounded-full" />
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-[#008A4E] rounded-full">
              <span className="text-white text-xs font-semibold flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Notificações e auditoria ativadas
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-[#2A2933] text-[22px] font-bold font-['Inter']">
              {user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.username}
            </h2>
            <p className="text-[#616167] text-sm font-medium">
              @{user?.username}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                user?.is_admin_role
                  ? "bg-[#FFDAD8] text-[#2A2933]"
                  : "bg-[#F8F6F4] text-[#616167]"
              }`}
            >
              {user?.is_admin_role ? "Admin" : "Usuário"} |{" "}
              {user?.is_admin_role ? "acesso total ao CRM" : "acesso limitado"}
            </div>
          </div>

          {user?.last_login && (
            <div className="flex items-center gap-2 text-[#616167] text-sm">
              <Clock className="w-4 h-4" />
              <span>Último login: {formatDate(user.last_login)}</span>
            </div>
          )}
        </div>

        <div className="w-[200px] bg-white rounded-[24px] p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[#2A2933]">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-semibold">Status</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[#939399] text-xs">E-mail</span>
              <span className="text-[#2A2933] text-xs font-medium truncate ml-2">
                {user?.email}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#939399] text-xs">ID</span>
              <span className="text-[#2A2933] text-xs font-medium">
                #{user?.id}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsPasswordModalOpen(true)}
            className="mt-auto"
          >
            <Key className="w-4 h-4 mr-1" />
            Alterar senha
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Alterar Senha"
      >
        <div className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
              {success}
            </div>
          )}

          <Input
            label="Senha atual"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Digite sua senha atual"
          />
          <Input
            label="Nova senha"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Digite a nova senha"
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirme a nova senha"
          />

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setIsPasswordModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} disabled={saving}>
              {saving ? "Alterando..." : "Alterar senha"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
