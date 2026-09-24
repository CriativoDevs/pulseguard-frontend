import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: { translation: { welcome: "Welcome", servers: "Servers", metrics: "Metrics", notifications: "Notifications", billing: "Billing", members: "Members", login: "Login", logout: "Logout", theme: "Theme", light: "Light", dark: "Dark", addServer: "Add server", status: "Status", uptime: "Uptime" } },
  pt: { translation: { welcome: "Bem-vindo", servers: "Servidores", metrics: "Métricas", notifications: "Notificações", billing: "Faturamento", members: "Membros", login: "Entrar", logout: "Sair", theme: "Tema", light: "Claro", dark: "Escuro", addServer: "Adicionar servidor", status: "Status", uptime: "Disponibilidade" } },
  "pt-br": { translation: { welcome: "Bem-vindo", servers: "Servidores", metrics: "Métricas", notifications: "Notificações", billing: "Faturamento", members: "Membros", login: "Entrar", logout: "Sair", theme: "Tema", light: "Claro", dark: "Escuro", addServer: "Adicionar servidor", status: "Status", uptime: "Disponibilidade" } },
  es: { translation: { welcome: "Bienvenido", servers: "Servidores", metrics: "Métricas", notifications: "Notificaciones", billing: "Facturación", members: "Miembros", login: "Iniciar sesión", logout: "Salir", theme: "Tema", light: "Claro", dark: "Oscuro", addServer: "Agregar servidor", status: "Estado", uptime: "Disponibilidad" } },
  fr: { translation: { welcome: "Bienvenue", servers: "Serveurs", metrics: "Métriques", notifications: "Notifications", billing: "Facturation", members: "Membres", login: "Connexion", logout: "Déconnexion", theme: "Thème", light: "Clair", dark: "Sombre", addServer: "Ajouter un serveur", status: "Statut", uptime: "Disponibilité" } },
  it: { translation: { welcome: "Benvenuto", servers: "Server", metrics: "Metriche", notifications: "Notifiche", billing: "Fatturazione", members: "Membri", login: "Accedi", logout: "Esci", theme: "Tema", light: "Chiaro", dark: "Scuro", addServer: "Aggiungi server", status: "Stato", uptime: "Disponibilità" } },
  ig: { translation: { welcome: "Nnọọ", servers: "Sava", metrics: "Metrics", notifications: "Ndụmọdụ", billing: "Ịkwụ ụgwọ", members: "Ọmụma", login: "Banye", logout: "Pụta", theme: "Isiokwu", light: "Ọcha", dark: "Dị ọchịchịrị", addServer: "Tinye sava", status: "Ọnọdụ", uptime: "Uptime" } },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: { order: ["querystring", "localStorage", "navigator"] },
  });

export default i18n;
