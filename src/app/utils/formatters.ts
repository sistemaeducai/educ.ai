/**
 * Utilitários de Formatação - Localização PT-BR
 * Sistema EDUC.AI
 */

/**
 * Formata número com separadores brasileiros
 * @param value Número a ser formatado
 * @param decimals Quantidade de casas decimais (padrão: 2)
 * @returns String formatada no padrão brasileiro (ex: "1.234,56")
 * @example formatNumber(1234.56) → "1.234,56"
 * @example formatNumber(1234.56, 0) → "1.235"
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Formata valor monetário em Reais
 * @param value Valor numérico
 * @returns String formatada com símbolo R$ (ex: "R$ 1.234,56")
 * @example formatCurrency(1234.56) → "R$ 1.234,56"
 */
export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

/**
 * Formata porcentagem no padrão brasileiro
 * @param value Valor decimal (0-1)
 * @param decimals Quantidade de casas decimais (padrão: 1)
 * @returns String formatada com símbolo % (ex: "87,5%")
 * @example formatPercentage(0.875) → "87,5%"
 * @example formatPercentage(0.875, 2) → "87,50%"
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return (value * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + '%';
};

/**
 * Formata nota acadêmica (0-10) no padrão brasileiro
 * @param value Nota numérica
 * @returns String formatada com 1 casa decimal (ex: "8,5")
 * @example formatGrade(8.5) → "8,5"
 * @example formatGrade(10) → "10,0"
 */
export const formatGrade = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
};

/**
 * Formata número inteiro no padrão brasileiro (sem decimais)
 * @param value Número inteiro
 * @returns String formatada (ex: "1.234")
 * @example formatInteger(1234) → "1.234"
 */
export const formatInteger = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};
