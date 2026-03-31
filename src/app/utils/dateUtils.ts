/**
 * Utilitários de Data - Localização PT-BR
 * Sistema EDUC.AI
 */

import { format, parseISO, formatDistanceToNow, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata data no padrão brasileiro
 * @param date Data a ser formatada (Date ou string ISO)
 * @param pattern Padrão de formatação (padrão: 'dd/MM/yyyy')
 * @returns String formatada no padrão especificado
 * @example formatDate(new Date(), 'dd/MM/yyyy') → "23/02/2026"
 * @example formatDate('2026-02-23', 'dd/MM/yyyy') → "23/02/2026"
 */
export const formatDate = (
  date: Date | string,
  pattern: string = 'dd/MM/yyyy'
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Data inválida';
    }
    return format(dateObj, pattern, { locale: ptBR });
  } catch (error) {
    return 'Data inválida';
  }
};

/**
 * Formata data por extenso no padrão brasileiro
 * @param date Data a ser formatada
 * @returns String formatada por extenso (ex: "23 de fevereiro de 2026")
 * @example formatDateLong(new Date()) → "23 de fevereiro de 2026"
 */
export const formatDateLong = (date: Date | string): string => {
  return formatDate(date, "d 'de' MMMM 'de' yyyy");
};

/**
 * Formata data com hora
 * @param date Data a ser formatada
 * @returns String formatada com data e hora (ex: "23/02/2026 às 14:30")
 * @example formatDateTime(new Date()) → "23/02/2026 às 14:30"
 */
export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm");
};

/**
 * Formata distância temporal relativa
 * @param date Data a ser comparada com agora
 * @returns String com distância relativa (ex: "há 2 minutos")
 * @example formatRelativeTime(new Date()) → "há alguns segundos"
 * @example formatRelativeTime(new Date(Date.now() - 3600000)) → "há cerca de 1 hora"
 */
export const formatRelativeTime = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Data inválida';
    }
    return formatDistanceToNow(dateObj, {
      addSuffix: true,
      locale: ptBR,
    });
  } catch (error) {
    return 'Data inválida';
  }
};

/**
 * Retorna dia da semana por extenso
 * @param date Data
 * @returns Dia da semana (ex: "segunda-feira")
 * @example getDayOfWeek(new Date()) → "segunda-feira"
 */
export const getDayOfWeek = (date: Date | string): string => {
  return formatDate(date, 'EEEE');
};

/**
 * Retorna dia da semana abreviado
 * @param date Data
 * @returns Dia da semana abreviado (ex: "seg")
 * @example getDayOfWeekShort(new Date()) → "seg"
 */
export const getDayOfWeekShort = (date: Date | string): string => {
  return formatDate(date, 'EEE');
};

/**
 * Retorna mês por extenso
 * @param date Data
 * @returns Mês por extenso (ex: "fevereiro")
 * @example getMonthName(new Date()) → "fevereiro"
 */
export const getMonthName = (date: Date | string): string => {
  return formatDate(date, 'MMMM');
};

/**
 * Retorna mês abreviado
 * @param date Data
 * @returns Mês abreviado (ex: "fev")
 * @example getMonthShort(new Date()) → "fev"
 */
export const getMonthShort = (date: Date | string): string => {
  return formatDate(date, 'MMM');
};

/**
 * Formata apenas a hora
 * @param date Data
 * @returns Hora formatada (ex: "14:30")
 * @example formatTime(new Date()) → "14:30"
 */
export const formatTime = (date: Date | string): string => {
  return formatDate(date, 'HH:mm');
};

/**
 * Formata hora com segundos
 * @param date Data
 * @returns Hora formatada com segundos (ex: "14:30:45")
 * @example formatTimeWithSeconds(new Date()) → "14:30:45"
 */
export const formatTimeWithSeconds = (date: Date | string): string => {
  return formatDate(date, 'HH:mm:ss');
};
