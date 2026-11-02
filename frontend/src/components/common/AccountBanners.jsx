/**
 * AccountBanners - CITAMED.VE
 * Avisos fijos arriba: correo sin verificar y verificación profesional del médico.
 */
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MailWarning, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAccountBanners } from '../../config/accountBanners';

const TONES = {
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  info: 'bg-sky-50 border-sky-200 text-sky-900',
  danger: 'bg-red-50 border-red-200 text-red-900'
};

export default function AccountBanners() {
  const { user, refreshUser } = useAuth();
  const { pathname } = useLocation();
  const userId = user?.id;

  // Una vez por sesión se trae el estado real (la copia guardada puede estar vieja)
  useEffect(() => {
    if (userId) refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const banners = getAccountBanners(user, pathname);
  if (banners.length === 0) return null;

  return (
    <div role="region" aria-label="Avisos de tu cuenta">
      {banners.map((b) => {
        const Icon = b.key === 'email' ? MailWarning : ShieldAlert;
        return (
          <div key={b.key} className={`border-b px-4 py-2.5 ${TONES[b.tone]}`} data-testid={`banner-${b.key}`}>
            <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                {b.text}
              </span>
              <Link to={b.to} className="font-semibold underline underline-offset-2 whitespace-nowrap">
                {b.actionLabel}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
