import { z } from 'zod';
export const organizationInput = z.object({
  name: z.string().trim().min(2).max(120),
  timezone: z.string().trim().min(1).refine(value => {
    try { new Intl.DateTimeFormat('fr', { timeZone: value }); return true; } catch { return false; }
  }, 'Choisissez un fuseau horaire valide.'),
});
