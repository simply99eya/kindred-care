import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { normalizeLanguage } from "@/lib/translations";

export default function ProfileLanguageSync() {
  const { user, loading } = useAuth();
  const { syncLanguageFromProfile } = useLanguage();
  const profile = trpc.care.profile.get.useQuery(undefined, { enabled: Boolean(user) && !loading, retry: false });
  const savedLanguage = normalizeLanguage(profile.data?.language);

  useEffect(() => {
    if (user && savedLanguage) syncLanguageFromProfile(savedLanguage);
  }, [user, savedLanguage, syncLanguageFromProfile]);

  return null;
}
