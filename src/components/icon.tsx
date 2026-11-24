import {
  Armchair, Atom, BadgeCheck, Building2, Calendar, Camera, Car, Clock, Coffee, Crown, DoorOpen, Droplets,
  FlaskConical, Gem, Hammer, HardHat, Heart, KeyRound, Lamp, Leaf, Lock, Mail, MapPin, MonitorSmartphone,
  Paintbrush, Palette, ParkingSquare, Phone, Ruler, Scissors, ShieldCheck, Sparkles, Star, Sun, Users, Video,
  WashingMachine, Wifi, Wind, Zap, type LucideIcon, type LucideProps,
} from 'lucide-react';
import type { ICON_OPTIONS } from '@/lib/fields';

export const ICONS: Record<(typeof ICON_OPTIONS)[number], LucideIcon> = {
  KeyRound, ShieldCheck, Droplets, Wind, WashingMachine, Wifi, Zap, Coffee, MonitorSmartphone, ParkingSquare,
  Sparkles, Scissors, Armchair, Lamp, Lock, Clock, Sun, Star, Heart, Gem, Palette, Paintbrush, Ruler, Hammer,
  HardHat, Camera, Video, MapPin, Car, Phone, Mail, Calendar, Users, Crown, FlaskConical, Atom, Building2,
  DoorOpen, Leaf, BadgeCheck,
};

/** Renders an icon by the name chosen in the admin `icon` field. */
export function DynamicIcon({ name, ...props }: { name?: unknown } & LucideProps) {
  const Cmp = (typeof name === 'string' && ICONS[name as keyof typeof ICONS]) || Sparkles;
  return <Cmp {...props} />;
}
