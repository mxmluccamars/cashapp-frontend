export interface F1Theme {
  id: string;
  name: string;
  subtitle: string;
  logoUrl: string;      // URL da imagem/logo oficial na internet
  bgDark: string;       // Fundo principal do app
  bgCard: string;       // Fundo dos cards e seções
  primary: string;      // Cor primária (botões principais, destaques)
  primaryHover: string;
  secondary: string;    // Cor secundária (bordas, detalhes, acentos)
  accent: string;       // Destaques e telemetria
  badgeBg: string;      // Fundo sutil das tags
}

export const F1_THEMES: Record<string, F1Theme> = {
  rb: {
    id: 'rb',
    name: 'Visa Cash App RB',
    subtitle: 'Racing Bulls F1 Team',
    // Logo transparente do touro / equipe Racing Bulls
    logoUrl: 'https://files.brandlogos.net/svg/KCGf0r4L58/Visa_Cash_App_Racing_Bulls_Formula_One_Team-logo-brandlogos-53d6d3.svg',
    bgDark: '#080d1a',        // Azul escuro profundo
    bgCard: '#0f172a',        // Slate azulado
    primary: '#004de6',       // Azul Elétrico Racing Bulls
    primaryHover: '#003bb8',
    secondary: '#e8112d',     // Vermelho Touro / Fita
    accent: '#38bdf8',        // Ciano de telemetria
    badgeBg: 'rgba(0, 77, 230, 0.15)'
  },
  mercedes: {
    id: 'mercedes',
    name: 'Mercedes-AMG Petronas',
    subtitle: 'Formula One Team',
    // Logo clássico Mercedes-AMG Petronas
    logoUrl: 'https://files.brandlogos.net/svg/6pHg9QdYGc/Mercedes-AMG_Petronas_F1-ONBJqzSJf_brandlogos.net.svg',
    bgDark: '#0f090d',        // Preto Carbono
    bgCard: '#13151c',        // Cinza grafite técnico
    primary: '#00a19b',       // Verde Petronas / Turquesa
    primaryHover: '#00847f',
    secondary: '#d1d5db',     // Prata Flechas de Prata
    accent: '#22d3ee',        // Destaque de telemetria
    badgeBg: 'rgba(0, 161, 155, 0.15)'
  }
};