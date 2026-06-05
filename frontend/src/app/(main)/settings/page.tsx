"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Camera, 
  AlertCircle,
  CheckCircle2,
  Construction, 
  LogOut, 
  UserCircle, 
  CreditCard,
  User,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/api/client";
import { updateProfile, changePassword, deleteAccount } from "@/api/user";

type SettingsTab = "account" | "payments";
type ToastTone = "success" | "error";

interface ToastState {
  tone: ToastTone;
  title: string;
  message: string;
}

const TABS: { id: SettingsTab; title: string; description: string; icon: any }[] = [
  { id: "account", title: "Mi cuenta", description: "Datos personales y seguridad.", icon: UserCircle },
  { id: "payments", title: "Métodos de pago", description: "Administrá tus métodos.", icon: CreditCard },
];

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function joinName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidNamePart(value: string, required: boolean) {
  const trimmed = value.trim();
  if (!trimmed) return !required;
  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{2,50}$/.test(trimmed);
}

function translateApiError(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return fallback;

  const message = error.message.toLowerCase();
  if (error.code === "UNAUTHORIZED" || message.includes("current password")) {
    return "La contraseña actual no es correcta.";
  }
  if (error.code === "FORBIDDEN" || message.includes("password cannot be changed")) {
    return "No se puede cambiar la contraseña de esta cuenta.";
  }
  if (error.code === "VALIDATION_ERROR") {
    return "Revisá los datos ingresados e intentá nuevamente.";
  }
  return error.message || fallback;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[320px] py-12 px-6 bg-white/[0.02] border border-dashed border-white/[0.12] rounded-xl">
      <Construction className="w-12 h-12 text-primary mb-4 opacity-80" />
      <h2 className="text-[1.1rem] font-bold text-white mb-2">{title}</h2>
      <p className="text-[0.9rem] text-white/50 max-w-[360px] leading-[1.5]">
        <strong>Próximamente.</strong> {description}
      </p>
    </div>
  );
}

/* Shared input class builder */
function fieldInputClass(hasError: boolean) {
  return clsx(
    "w-full max-w-[400px] max-md:max-w-full h-11 px-3.5 rounded-[10px] border bg-black/35 text-white text-[0.9rem] outline-none transition-[border-color,box-shadow] duration-200",
    "focus:border-primary focus:shadow-[0_0_0_2px_rgba(175,232,5,0.15)]",
    "disabled:opacity-65 disabled:cursor-not-allowed",
    hasError
      ? "border-[rgba(255,92,92,0.7)] shadow-[0_0_0_2px_rgba(213,2,4,0.16)] focus:border-[rgba(255,92,92,0.7)]"
      : "border-white/[0.12]"
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  const [firstName, setFirstName] = useState(() => user ? splitName(user.name).firstName : "");
  const [lastName, setLastName] = useState(() => user ? splitName(user.name).lastName : "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const isGoogleUser = user?.authProvider === "google";
  const canChangePassword = user?.authProvider === "local";

  const isChanged = user && (
    firstName !== splitName(user.name).firstName ||
    lastName !== splitName(user.name).lastName
  );
  const validation = useMemo(() => {
    const errors: { firstName?: string; lastName?: string; email?: string } = {};

    if (!isValidNamePart(firstName, true)) {
      errors.firstName = "Ingresá un nombre válido de al menos 2 letras.";
    }
    if (!isValidNamePart(lastName, false)) {
      errors.lastName = "Usá solo letras, espacios, apóstrofes o guiones.";
    }
    if (user?.email && !isValidEmail(user.email)) {
      errors.email = "El correo asociado a tu cuenta no tiene un formato válido.";
    }

    return errors;
  }, [firstName, lastName, user?.email]);
  const hasValidationErrors = Object.keys(validation).length > 0;

  useEffect(() => {
    if (!user || !user.name) return;
    try {
      const { firstName: f, lastName: l } = splitName(user.name);
      setFirstName(f);
      setLastName(l);
    } catch (err) {
      console.error('[Settings] Error splitting name:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    if (!user) return;

    const name = joinName(firstName, lastName);
    if (!name || hasValidationErrors) {
      setToast({
        tone: "error",
        title: "Revisá tus datos",
        message: "Hay campos que necesitan corrección antes de guardar.",
      });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfile(name, user.avatar ?? undefined);
      setUser(updated);
      setToast({
        tone: "success",
        title: "Cambios guardados",
        message: "Tu información personal se actualizó correctamente.",
      });
    } catch (error) {
      setToast({
        tone: "error",
        title: "No pudimos guardar",
        message: translateApiError(error, "No pudimos guardar los cambios. Intentá de nuevo."),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setToast({
        tone: "success",
        title: "Contraseña actualizada",
        message: "Tu contraseña se cambió correctamente.",
      });
    } catch (error) {
      const message = translateApiError(error, "No pudimos cambiar la contraseña.");
      setPasswordError(message);
      setToast({
        tone: "error",
        title: "No pudimos cambiarla",
        message,
      });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  async function handleDeleteAccount() {
    if (!confirm("¿Estás seguro de que querés eliminar tu cuenta? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await deleteAccount();
      router.push("/login");
    } catch (error) {
      setToast({
        tone: "error",
        title: "No pudimos eliminar la cuenta",
        message: "Intentá nuevamente en unos minutos.",
      });
    }
  }

  const handleAvatarChangeClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setToast({
        tone: "error",
        title: "Imagen demasiado pesada",
        message: "El archivo no puede superar los 2 MB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setSaving(true);
      try {
        const updated = await updateProfile(user?.name || "", base64);
        setUser(updated);
        setToast({
          tone: "success",
          title: "Avatar actualizado",
          message: "Tu nueva imagen de perfil ya está guardada.",
        });
      } catch (error) {
        setToast({
          tone: "error",
          title: "No pudimos actualizar el avatar",
          message: "Intentá con otra imagen o probá nuevamente.",
        });
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!user) return null;

  return (
    <>
      <Header
        title="Configuración"
        subtitle="Gestioná tu información personal y las preferencias de tu cuenta."
      />

      <main className="flex-1 px-8 pt-6 pb-8 flex flex-col gap-6 relative max-[900px]:px-4">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              className={clsx(
                "fixed z-[120] flex items-start gap-3.5 p-4 rounded-[10px] overflow-hidden shadow-[0_22px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)_inset]",
                "md:top-7 md:right-7 md:w-[min(420px,calc(100vw-56px))]",
                "max-md:bottom-4 max-md:left-4 max-md:right-4 max-md:w-auto",
                toast.tone === "success"
                  ? "bg-[#111a12] border border-[rgba(0,206,23,0.32)] text-[#f1fff5]"
                  : "bg-[#1e1112] border border-[rgba(213,2,4,0.36)] text-[#fff0f0]"
              )}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              role="status"
            >
              {/* Left accent bar */}
              <span
                className={clsx(
                  "absolute inset-y-0 left-0 w-1",
                  toast.tone === "success" ? "bg-[#00ce17]" : "bg-[#d50204]"
                )}
              />
              <span className={clsx(
                "flex items-center justify-center w-[38px] h-[38px] rounded-full shrink-0",
                toast.tone === "success"
                  ? "bg-[rgba(0,206,23,0.13)] text-[#00ce17]"
                  : "bg-[rgba(213,2,4,0.15)] text-[#ff5c5c]"
              )}>
                {toast.tone === "success" ? (
                  <CheckCircle2 className="w-[21px] h-[21px]" />
                ) : (
                  <AlertCircle className="w-[21px] h-[21px]" />
                )}
              </span>
              <span className="flex min-w-0 flex-col gap-[3px]">
                <span className="text-white text-[0.92rem] font-black leading-[1.25]">{toast.title}</span>
                <span className="text-white/[0.68] text-[0.82rem] font-semibold leading-[1.35]">{toast.message}</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Layout: sidebar nav + content */}
        <div className="grid [grid-template-columns:280px_1fr] gap-8 items-start max-[900px]:grid-cols-1">

          {/* Sub-navigation */}
          <nav className="flex flex-col gap-2" aria-label="Secciones de configuración">
            {TABS.map(({ id, title, description, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={clsx(
                    "flex flex-row items-center gap-3.5 w-full px-[18px] py-[14px] rounded-xl border cursor-pointer text-left transition-all duration-200 relative",
                    isActive
                      ? "bg-[rgba(175,232,5,0.06)] border-[rgba(175,232,5,0.25)] before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-[55%] before:rounded-r-[3px] before:bg-primary"
                      : "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.12]"
                  )}
                  onClick={() => setActiveTab(id)}
                >
                  <div className={clsx(
                    "flex items-center justify-center w-[38px] h-[38px] rounded-[10px] transition-all duration-200",
                    isActive
                      ? "bg-[rgba(175,232,5,0.15)] text-primary"
                      : "bg-white/[0.05] text-white/40"
                  )}>
                    <Icon size={20} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className={clsx(
                      "text-[0.95rem] font-bold",
                      isActive ? "text-primary" : "text-white"
                    )}>
                      {title}
                    </span>
                    <span className="text-[0.78rem] text-white/45 leading-[1.35]">{description}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Content panel */}
          <div className="flex flex-col gap-6">

            {activeTab === "account" && (
              <>
                {/* Personal info */}
                <form onSubmit={handleSaveProfile}>
                  <section className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-7">
                    <h2 className="flex items-center gap-3 text-[1.15rem] font-bold text-white mb-6">
                      <User className="text-primary" size={24} />
                      Información personal
                    </h2>

                    <div className="flex gap-8 items-start mb-7 max-[900px]:flex-col max-[900px]:items-center max-[900px]:text-center">
                      {/* Avatar */}
                      <div className="flex flex-col items-center shrink-0 w-[120px]">
                        <div className="relative w-[120px] h-[120px]">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-[120px] h-[120px] rounded-full object-cover border-2 border-white/10"
                            />
                          ) : (
                            <span className="w-[120px] h-[120px] rounded-full flex items-center justify-center font-display text-[2rem] font-extrabold text-secondary bg-primary border-2 border-white/10">
                              {getInitials(user.name)}
                            </span>
                          )}
                          <button
                            type="button"
                            className="absolute right-0 bottom-0 w-9 h-9 rounded-full border-[3px] border-[#1a1a1a] bg-primary text-secondary flex items-center justify-center cursor-pointer transition-transform duration-200 z-10 hover:scale-110"
                            onClick={handleAvatarChangeClick}
                            title="Cambiar imagen"
                            aria-label="Cambiar foto de perfil"
                          >
                            <Camera size={18} />
                          </button>
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          hidden
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                        <p className="text-[0.75rem] text-white/45 mt-2 mb-0 max-w-[140px] leading-[1.35] max-[900px]:max-w-none max-[900px]:text-center max-md:mb-6 max-md:mt-4">
                          Cambiá tu imagen de perfil.
                        </p>
                      </div>

                      {/* Form fields */}
                      <div className="flex-1 grid grid-cols-2 gap-5 max-[900px]:grid-cols-1">
                        <div>
                          <label className="block text-[0.8rem] font-semibold text-white/55 mb-2" htmlFor="firstName">
                            Nombre
                          </label>
                          <input
                            id="firstName"
                            className={fieldInputClass(Boolean(validation.firstName))}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            autoComplete="given-name"
                            maxLength={50}
                            aria-invalid={Boolean(validation.firstName)}
                            aria-describedby={validation.firstName ? "firstName-error" : undefined}
                          />
                          {validation.firstName && (
                            <p id="firstName-error" className="text-[0.72rem] text-[#ff9a9a] mt-1.5 leading-[1.35]">
                              {validation.firstName}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-[0.8rem] font-semibold text-white/55 mb-2" htmlFor="lastName">
                            Apellido
                          </label>
                          <input
                            id="lastName"
                            className={fieldInputClass(Boolean(validation.lastName))}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            autoComplete="family-name"
                            maxLength={50}
                            aria-invalid={Boolean(validation.lastName)}
                            aria-describedby={validation.lastName ? "lastName-error" : undefined}
                          />
                          {validation.lastName && (
                            <p id="lastName-error" className="text-[0.72rem] text-[#ff9a9a] mt-1.5 leading-[1.35]">
                              {validation.lastName}
                            </p>
                          )}
                        </div>
                        <div className="col-span-full">
                          <label className="block text-[0.8rem] font-semibold text-white/55 mb-2" htmlFor="email">
                            Correo electrónico
                          </label>
                          <input
                            id="email"
                            type="email"
                            className={fieldInputClass(Boolean(validation.email))}
                            value={user.email}
                            disabled
                            readOnly
                            aria-invalid={Boolean(validation.email)}
                            aria-describedby={validation.email ? "email-error" : "email-hint"}
                          />
                          <p id="email-hint" className="text-[0.72rem] text-white/40 mt-1.5">
                            El correo no se puede modificar porque es tu identificador de acceso.
                          </p>
                          {validation.email && (
                            <p id="email-error" className="text-[0.72rem] text-[#ff9a9a] mt-1.5 leading-[1.35]">
                              {validation.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center mt-2">
                      <button
                        type="submit"
                        className="min-w-[220px] max-md:w-full h-12 px-8 border-none rounded-[10px] bg-primary text-secondary text-[0.95rem] font-bold cursor-pointer transition-[opacity] duration-200 select-none flex items-center justify-center hover:enabled:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={saving || !isChanged || hasValidationErrors}
                      >
                        {saving ? (
                          <span className="w-5 h-5 border-[3px] border-black/10 border-t-secondary rounded-full animate-spin" />
                        ) : (
                          "Guardar cambios"
                        )}
                      </button>
                    </div>
                  </section>
                </form>

                {/* Security */}
                <section className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-7">
                  <h2 className="flex items-center gap-3 text-[1.15rem] font-bold text-white mb-6">
                    <ShieldCheck className="text-primary" size={24} />
                    Seguridad de la cuenta
                  </h2>

                  {/* Password row */}
                  <div className="flex items-center justify-between gap-4 py-[18px] border-b border-white/[0.06] first:pt-0 max-md:flex-col max-md:items-stretch">
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.9rem] font-semibold text-white mb-1">
                        Contraseña
                        {isGoogleUser && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[0.72rem] font-semibold bg-[rgba(175,232,5,0.12)] text-primary ml-2">
                            Google
                          </span>
                        )}
                      </div>
                      <p className="text-[0.8rem] text-white/50 leading-[1.4]">
                        {isGoogleUser
                          ? "Iniciaste sesión con Google. Gestioná tu contraseña desde tu cuenta de Google."
                          : "Actualizá tu contraseña de acceso a Prodeazo."}
                      </p>
                    </div>
                    {canChangePassword ? (
                      <>
                        <span className="text-[0.9rem] text-white/70 tracking-[0.08em] max-md:hidden">••••••••••••</span>
                        <button
                          type="button"
                          className="shrink-0 h-10 px-[18px] rounded-[10px] border border-white/20 bg-transparent text-white text-[0.85rem] font-semibold cursor-pointer transition-all duration-200 select-none hover:bg-white/[0.06] hover:border-white/35 disabled:opacity-45 disabled:cursor-not-allowed max-md:w-full"
                          onClick={() => { setPasswordOpen(true); setPasswordError(null); }}
                        >
                          Cambiar contraseña
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="shrink-0 h-10 px-[18px] rounded-[10px] border border-white/20 bg-transparent text-white text-[0.85rem] font-semibold cursor-pointer transition-all duration-200 select-none disabled:opacity-45 disabled:cursor-not-allowed max-md:w-full"
                        disabled
                      >
                        No disponible
                      </button>
                    )}
                  </div>

                  {/* 2FA row */}
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-[18px] last:border-b-0 last:pb-0 max-md:flex-col max-md:items-stretch">
                    <div className="text-[0.9rem] font-semibold text-white md:flex-1 md:min-w-0">
                      Autenticación en dos pasos
                    </div>
                    <p className="text-[0.8rem] text-white/50 leading-[1.4] basis-full max-md:order-3">
                      Protegé tu cuenta con un segundo factor de verificación.
                    </p>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[0.72rem] font-bold uppercase tracking-[0.03em] bg-white/[0.08] text-white/55 max-md:order-2 max-md:w-fit">
                      Próximamente
                    </span>
                    <button
                      type="button"
                      className="shrink-0 h-10 px-[18px] rounded-[10px] border border-white/20 bg-transparent text-white text-[0.85rem] font-semibold cursor-pointer transition-all duration-200 select-none disabled:opacity-45 disabled:cursor-not-allowed max-md:order-4 max-md:w-full"
                      disabled
                    >
                      Gestionar
                    </button>
                  </div>
                </section>

                {/* Danger zone */}
                <section className="bg-[rgba(213,2,4,0.04)] border border-[rgba(213,2,4,0.25)] rounded-xl p-7">
                  <h2 className="flex items-center gap-3 text-[1.15rem] font-bold text-white mb-6">
                    <Trash2 className="text-[#ff6b6b]" size={24} />
                    Eliminar cuenta
                  </h2>
                  <div className="flex items-center justify-between gap-6 max-[900px]:flex-col max-[900px]:items-start">
                    <p className="text-[0.85rem] text-white/65 leading-[1.5] max-w-[520px]">
                      Esta acción no se puede deshacer. Se eliminarán todos tus datos y
                      perderás el acceso a tu cuenta.
                    </p>
                    <button
                      type="button"
                      className="shrink-0 h-10 px-[22px] rounded-[10px] border border-[rgba(213,2,4,0.6)] bg-transparent text-[#ff6b6b] text-[0.85rem] font-semibold cursor-pointer transition-all duration-200 select-none hover:bg-[rgba(213,2,4,0.1)] hover:border-[#ff6b6b] max-md:w-full"
                      onClick={handleDeleteAccount}
                    >
                      Eliminar mi cuenta
                    </button>
                  </div>
                </section>

                {/* Logout */}
                <button
                  type="button"
                  className="flex items-center justify-center gap-2.5 w-full h-12 mt-2 rounded-[10px] border border-white/10 bg-white/[0.02] text-white/75 text-[0.9rem] font-semibold cursor-pointer transition-all duration-200 hover:bg-white/[0.05] hover:text-white"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  Cerrar sesión
                </button>
              </>
            )}

            {activeTab === "payments" && (
              <ComingSoon
                title="Métodos de pago"
                description="La administración de métodos de pago estará disponible en una versión futura."
              />
            )}
          </div>
        </div>
      </main>

      {/* Change password modal */}
      {passwordOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/75"
          role="dialog"
          aria-modal="true"
          aria-labelledby="password-modal-title"
          onClick={() => setPasswordOpen(false)}
        >
          <div
            className="w-full max-w-[420px] p-7 rounded-[14px] border border-white/10 bg-[#111]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="password-modal-title" className="text-[1.15rem] font-bold text-white mb-2">
              Cambiar contraseña
            </h3>
            <p className="text-[0.85rem] text-white/55 mb-6 leading-[1.45]">
              Ingresá tu contraseña actual y elegí una nueva de al menos 8 caracteres.
            </p>
            <form onSubmit={handleChangePassword}>
              <div className="flex flex-col gap-4 mb-6">
                <div>
                  <label className="block text-[0.8rem] font-semibold text-white/55 mb-2" htmlFor="currentPassword">
                    Contraseña actual
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    className={fieldInputClass(false)}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    minLength={1}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[0.8rem] font-semibold text-white/55 mb-2" htmlFor="newPassword">
                    Nueva contraseña
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    className={fieldInputClass(false)}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[0.8rem] font-semibold text-white/55 mb-2" htmlFor="confirmPassword">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className={fieldInputClass(false)}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              {passwordError && (
                <p className="text-center text-[0.85rem] text-[#fca5a5] my-3 mb-[18px]" role="alert">
                  {passwordError}
                </p>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  className="h-[42px] px-[18px] rounded-[10px] border border-white/15 bg-transparent text-white/80 font-semibold cursor-pointer hover:bg-white/[0.06]"
                  onClick={() => setPasswordOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-[42px] px-5 rounded-[10px] border-none bg-primary text-secondary font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={passwordSaving || !currentPassword || newPassword.length < 8 || confirmPassword.length < 8}
                >
                  {passwordSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
