import React from 'react';
import {
  UtensilsCrossed, Car, ShoppingBag, Heart,
  Stethoscope, Home, MoreHorizontal
} from 'lucide-react';
import { HelpTaskCategory } from '../../types';

export const CATEGORY_CONFIG: Record<HelpTaskCategory, {
  icon: React.ElementType;
  label: string;
  color: string;
  bgClass: string;
  textClass: string
}> = {
  meals: { icon: UtensilsCrossed, label: 'Meals', color: 'orange', bgClass: 'bg-orange-100', textClass: 'text-orange-600' },
  transport: { icon: Car, label: 'Transport', color: 'blue', bgClass: 'bg-blue-100', textClass: 'text-blue-600' },
  errands: { icon: ShoppingBag, label: 'Errands', color: 'purple', bgClass: 'bg-purple-100', textClass: 'text-purple-600' },
  companionship: { icon: Heart, label: 'Companionship', color: 'pink', bgClass: 'bg-pink-100', textClass: 'text-pink-600' },
  medical: { icon: Stethoscope, label: 'Medical', color: 'red', bgClass: 'bg-red-100', textClass: 'text-red-600' },
  household: { icon: Home, label: 'Household', color: 'green', bgClass: 'bg-green-100', textClass: 'text-green-600' },
  other: { icon: MoreHorizontal, label: 'Other', color: 'slate', bgClass: 'bg-slate-100', textClass: 'text-slate-600' }
};

export const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Flexible'];
