import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

// Get browser language or default to English
const getBrowserLanguage = (): Language => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'en';
  }
  
  try {
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'es' ? 'es' : 'en';
  } catch (error) {
    console.warn('Error detecting browser language:', error);
    return 'en';
  }
};

// Get language from localStorage or from browser settings
const getInitialLanguage = (): Language => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return 'en';
  }
  
  try {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      return savedLanguage;
    }
  } catch (error) {
    console.warn('Error accessing localStorage for language:', error);
  }
  
  return getBrowserLanguage();
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, params?: Record<string, string | number>) => key,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  
  // Update language and save to localStorage
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('language', newLanguage);
      }
    } catch (error) {
      console.warn('Error saving language to localStorage:', error);
    }
  };

  // Load translations only once to avoid recreating this object on every render
  const translations = {
    en: {
      // Header
      'nav.home': 'Home',
      'nav.witnesses': 'Witnesses',
      'nav.schedule': 'Schedule',
      'nav.about': 'About',
      'login': 'Login',
      'login.withKeychain': 'Login with Keychain',
      'login.toVoteForWitnesses': 'to vote for witnesses',
      'logout': 'Logout',
      'language': 'Language',
      'english': 'English',
      'spanish': 'Spanish',
      
      // Home page
      'home.title': 'Welcome to Hive Witness Explorer',
      'home.description': 'Discover Hive blockchain witnesses, their profiles, and the votes they receive from the community.',
      'home.featured': 'Featured Witness',
      'home.viewAll': 'View All Witnesses',
      
      // Network Status
      'network.title': 'Hive Network Status',
      'network.subtitle': 'Current state of the Hive blockchain network',
      'network.blockHeight': 'Block Height',
      'network.transactions': 'Transactions/Day',
      'network.activeWitnesses': 'Active Witnesses',
      'network.hivePrice': 'HIVE Price',
      'network.apiNodes': 'API Nodes Status',
      'network.nodeUrl': 'Node URL',
      'network.nodeName': 'Node Name',
      'network.version': 'Version',
      'network.score': 'Score',
      'network.tests': 'Tests Passed',
      'network.viewAll': 'View All',
      'network.viewAllNodes': 'View All {{count}} Nodes',
      'network.apiNodesTitle': 'Hive API Nodes',
      'network.apiNodesSubtitle': 'Real-time status and performance metrics of Hive blockchain API nodes',
      'network.totalNodes': 'Total Nodes',
      'network.perfectScore': 'Perfect Score (100%)',
      'network.latestVersion': 'Latest Version',
      'network.tableInfo': 'Click column headers to sort',
      'network.tableInfoDetail': 'These nodes are monitored in real-time. Score represents the percentage of successful API calls. Click any node name to visit their endpoint.',
      'common.back': 'Back',
      
      // Witnesses page
      'witnesses.title': 'Hive Witnesses',
      'witnesses.description': 'Witnesses secure the Hive blockchain and produce blocks. They play a crucial role in governance and blockchain development.',
      'witnesses.search': 'Search witnesses',
      'witnesses.rank': 'Rank',
      'witnesses.name': 'Name',
      'witnesses.votes': 'Votes',
      'witnesses.lastBlock': 'Last Block',
      'witnesses.missedBlocks': 'Missed',
      'witnesses.fee': 'Price Feed',
      'witnesses.version': 'Version',
      'witnesses.hbdInterestRate': 'HBD APR',
      'witnesses.loading': 'Loading witnesses...',
      'witnesses.viewProfile': 'View Profile',
      'witnesses.vote': 'Vote',
      'witnesses.voted': 'Voted',
      'witnesses.unvote': 'Unvote',
      'witnesses.showing': 'Showing',
      'witnesses.of': 'of',
      'witnesses.website': 'Website',
      'witnesses.action': 'Action',
      'witnesses.loadMore': 'Load More',
      'witnesses.hideInactive': 'Hide Inactive Witnesses',
      
      // Sort
      'sort.by': 'Sort by',
      'sort.placeholder': 'Sort by...',
      
      // Witness profile page
      'profile.notFound': 'Witness Not Found',
      'profile.wasNotFound': 'The witness',
      'profile.viewAll': 'View All Witnesses',
      'profile.overview': 'Overview',
      'profile.voters': 'Voters',
      'profile.about': 'About',
      'profile.stats': 'Statistics',
      'profile.witnessInfo': 'Witness Information',
      'profile.rank': 'Rank',
      'profile.votes': 'Votes',
      'profile.votePower': 'Voting Power',
      'profile.lastBlock': 'Last Block',
      'profile.missedBlocks': 'Missed Blocks',
      'profile.fee': 'Price Feed',
      'profile.created': 'Account Created',
      'profile.activeSince': 'Active since',
      'profile.since': 'Witness since',
      'profile.title': 'Witness Profile',
      'profile.notFoundDesc': 'The witness was not found on the Hive blockchain',
      'profile.voteFor': 'Vote for Witness',
      'profile.visitWebsite': 'Visit Website',
      'profile.uptime': 'Uptime',
      'profile.reliability': 'Reliability',
      'profile.reliability.desc': 'A lower number of missed blocks indicates better reliability and uptime.',
      'profile.failed': 'Failed to load witness data.',
      'profile.votersTitle': 'Voters',
      'profile.witnessDescription': 'Witness Description',
      'profile.isWitness': 'is a Hive witness currently ranked',
      'profile.withVotes': 'with',
      'profile.fromCommunity': 'of support from the community.',
      'profile.asWitness': 'As a Hive witness,',
      'profile.responsible': 'is responsible for validating transactions, securing the blockchain, and participating in blockchain governance decisions.',
      'profile.elected': 'Witnesses are elected by Hive stakeholders and provide critical infrastructure for the Hive blockchain\'s operation.',
      'profile.blockProduction': 'Block Production',
      'profile.hasProduced': 'This witness has produced blocks up to number',
      'profile.andMissed': 'and has missed a total of',
      'profile.throughHistory': 'blocks throughout their history.',
      'profile.account': 'Account',
      'profile.username': 'Username',
      'profile.ownHP': 'Own HP',
      'profile.proxiedHP': 'Proxied HP',
      'profile.totalGov': 'Total governance vote',
      'profile.noVoters': 'No voters found for this witness.',
      
      // Modals
      'modal.login.title': 'Login with Hive Keychain',
      'modal.login.desc': 'Please enter your Hive username to login with Keychain.',
      'modal.login.username': 'Hive Username',
      'modal.login.enterUsername': 'Enter your username',
      'modal.login.action': 'Login with Keychain',
      'modal.login.keychain': 'Hive Keychain is required',
      'modal.login.keychainDesc': 'You need to install the Hive Keychain browser extension to login.',
      'modal.login.install': 'Install Keychain',
      'modal.login.cancel': 'Cancel',
      'modal.login.devMode': 'Development mode is active. You can log in with any username for testing.',
      'modal.login.logging': 'Logging in...',
      
      'modal.vote.title': 'Vote for Witness',
      'modal.vote.desc': 'You are about to vote for',
      'modal.vote.broadcast': 'This action will be broadcast to the Hive blockchain',
      'modal.vote.approval': 'Approval',
      'modal.vote.approve': 'Approve',
      'modal.vote.confirming': 'Confirming...',
      'modal.vote.confirm': 'Confirm Vote',
      'error': 'Error',
      'modal.vote.remove': 'Remove Vote',
      'modal.vote.cancel': 'Cancel',
      'modal.vote.warning': 'Warning',
      'modal.vote.warningDesc': 'You can only vote for up to 30 witnesses. Please remove a vote first if you\'ve reached your limit.',
      
      'modal.proxy.title': 'Accounts that have chosen',
      'modal.proxy.desc': 'These accounts have delegated their witness voting power to',
      'modal.proxy.desc2': 'Proxy relationships may change frequently on the Hive blockchain.',
      'modal.proxy.undiscovered': 'Undiscovered Accounts',
      'modal.proxy.proxyPower': 'Total proxy power:',
      'modal.proxy.explanation': 'This account has proxied votes, but we couldn\'t identify specific accounts. The Hive blockchain doesn\'t provide a direct way to query this relationship.',
      'modal.proxy.noAccounts': 'No accounts are currently using',
      'modal.proxy.asProxy': 'as their proxy',
      'modal.proxy.relationships': 'Proxy relationships on Hive may change over time. Our system uses multiple methods to find proxy relationships, including direct blockchain queries and cached data.',
      
      // About page
      'about.title': 'About Hive Witness Explorer',
      'about.description': 'A comprehensive tool for exploring Hive blockchain witnesses.',
      'about.purpose': 'Purpose',
      'about.purposeDesc': 'This application provides an easy way to discover, evaluate, and vote for Hive witnesses - the blockchain validators who secure the network and implement governance decisions.',
      'about.features': 'Features',
      'about.feature1': 'View detailed witness profiles',
      'about.feature2': 'See witness voters and their influence',
      'about.feature3': 'Explore proxy relationships',
      'about.feature4': 'Vote for witnesses securely using Hive Keychain',
      'about.tech': 'Technology',
      'about.techDesc': 'Built with React, Vite, and integrated with the Hive blockchain through direct API calls and Hive Keychain authentication.',
      'about.mission': 'Empowering Hive users with reliable blockchain infrastructure and governance while promoting decentralization through community engagement.',

      // NotFound page
      'notFound.title': '404 Page Not Found',
      'notFound.message': 'Did you forget to add the page to the router?',
      
      // User Stats page
      'userStats.title': 'Your Hive Statistics',
      'userStats.subtitle': 'View your Hive accounts stats, power metrics, and witness votes',
      'userStats.needLogin': 'You need to log in with Hive Keychain to view your stats',
      'userStats.witnessVotes': 'Witness Votes',
      'userStats.powerAnalysis': 'Power Analysis',
      'userStats.yourWitnessVotes': 'Your Witness Votes',
      'userStats.noWitnessVotes': 'You haven\'t voted for any witnesses yet',
      'userStats.browseWitnesses': 'Browse Witnesses',
      'userStats.hivePowerBreakdown': 'Hive Power Breakdown',
      'userStats.effectiveHP': 'Effective HP',
      'userStats.effectiveHPDesc': 'Your total effective Hive Power including delegations in/out',
      'userStats.ownHPDesc': 'Hive Power owned directly by your account',
      'userStats.proxiedHPDesc': 'Hive Power proxied to your account by other users',
      'userStats.governancePower': 'Governance Power',
      'userStats.governancePowerDesc': 'Your voting power for governance decisions and witness votes (own HP + proxied HP)',
      'userStats.proxyAccount': 'Proxy Account',
      'userStats.proxyExplanation': 'You have delegated your witness voting power to this account. This means they can vote for witnesses on your behalf.',
      'userStats.viewProxyVotes': 'View Proxy\'s Votes',
      'userStats.viewStats': 'View Stats',
      
      // Schedule page
      'schedule.title': 'Block Production Schedule',
      'schedule.description': 'Real-time view of the Hive blockchain witness block production schedule. See which witness is currently producing blocks and the upcoming rotation order.',
      
      // Footer
      'footer.description': 'Supporting the Hive blockchain ecosystem through reliable witness operations and community development.',
      'footer.quickLinks': 'Quick Links',
      'footer.aboutAliento': 'About Aliento',
      'footer.resources': 'Resources',
      'footer.developerPortal': 'Developer Portal',
      'footer.keychainSDK': 'Keychain SDK',
      'footer.beaconAPI': 'Beacon API',
      'footer.blockExplorer': 'Block Explorer',
      'footer.documentation': 'Documentation',
      'footer.copyright': 'All rights reserved.',
    },
    es: {
      // Header
      'nav.home': 'Inicio',
      'nav.witnesses': 'Testigos',
      'nav.schedule': 'Calendario',
      'nav.about': 'Acerca de',
      'login': 'Iniciar sesión',
      'login.withKeychain': 'Iniciar sesión con Keychain',
      'login.toVoteForWitnesses': 'para votar por los testigos',
      'logout': 'Cerrar sesión',
      'language': 'Idioma',
      'english': 'Inglés',
      'spanish': 'Español',
      
      // Home page
      'home.title': 'Bienvenido al Explorador de Testigos de Hive',
      'home.description': 'Descubre los testigos de la blockchain Hive, sus perfiles y los votos que reciben de la comunidad.',
      'home.featured': 'Testigo Destacado',
      'home.viewAll': 'Ver Todos los Testigos',
      
      // Network Status
      'network.title': 'Estado de la Red Hive',
      'network.subtitle': 'Estado actual de la red blockchain Hive',
      'network.blockHeight': 'Altura del Bloque',
      'network.transactions': 'Transacciones/Día',
      'network.activeWitnesses': 'Testigos Activos',
      'network.hivePrice': 'Precio de HIVE',
      'network.apiNodes': 'Estado de Nodos API',
      'network.nodeUrl': 'URL del Nodo',
      'network.nodeName': 'Nombre del Nodo',
      'network.version': 'Versión',
      'network.score': 'Puntuación',
      'network.tests': 'Pruebas Pasadas',
      'network.viewAll': 'Ver Todos',
      'network.viewAllNodes': 'Ver Todos los {{count}} Nodos',
      'network.apiNodesTitle': 'Nodos API de Hive',
      'network.apiNodesSubtitle': 'Estado en tiempo real y métricas de rendimiento de los nodos API de la blockchain Hive',
      'network.totalNodes': 'Total de Nodos',
      'network.perfectScore': 'Puntuación Perfecta (100%)',
      'network.latestVersion': 'Última Versión',
      'network.tableInfo': 'Haz clic en los encabezados de columna para ordenar',
      'network.tableInfoDetail': 'Estos nodos son monitoreados en tiempo real. La puntuación representa el porcentaje de llamadas API exitosas. Haz clic en cualquier nombre de nodo para visitar su endpoint.',
      'common.back': 'Volver',
      
      // Witnesses page
      'witnesses.title': 'Testigos de Hive',
      'witnesses.description': 'Los testigos aseguran la blockchain Hive y producen bloques. Juegan un papel crucial en la gobernanza y el desarrollo de la blockchain.',
      'witnesses.search': 'Buscar testigos',
      'witnesses.rank': 'Rango',
      'witnesses.name': 'Nombre',
      'witnesses.votes': 'Votos',
      'witnesses.lastBlock': 'Último Bloque',
      'witnesses.missedBlocks': 'Perdidos',
      'witnesses.fee': 'Precio de HIVE',
      'witnesses.version': 'Versión',
      'witnesses.hbdInterestRate': 'Interés HBD',
      'witnesses.loading': 'Cargando testigos...',
      'witnesses.viewProfile': 'Ver Perfil',
      'witnesses.vote': 'Votar',
      'witnesses.voted': 'Votado',
      'witnesses.unvote': 'Quitar Voto',
      'witnesses.showing': 'Mostrando',
      'witnesses.of': 'de',
      'witnesses.website': 'Sitio Web',
      'witnesses.action': 'Acción',
      'witnesses.loadMore': 'Cargar Más',
      'witnesses.hideInactive': 'Ocultar Testigos Inactivos',
      
      // Sort
      'sort.by': 'Ordenar por',
      'sort.placeholder': 'Ordenar por...',
      
      // Witness profile page
      'profile.notFound': 'Testigo No Encontrado',
      'profile.wasNotFound': 'El testigo',
      'profile.viewAll': 'Ver Todos los Testigos',
      'profile.overview': 'Resumen',
      'profile.voters': 'Votantes',
      'profile.about': 'Acerca de',
      'profile.stats': 'Estadísticas',
      'profile.witnessInfo': 'Información del Testigo',
      'profile.rank': 'Rango',
      'profile.votes': 'Votos',
      'profile.votePower': 'Poder de Voto',
      'profile.lastBlock': 'Último Bloque',
      'profile.missedBlocks': 'Bloques Perdidos',
      'profile.fee': 'Precio de HIVE',
      'profile.created': 'Cuenta Creada',
      'profile.activeSince': 'Activo desde',
      'profile.since': 'Testigo desde',
      'profile.title': 'Perfil de Testigo',
      'profile.notFoundDesc': 'El testigo no se encontró en la blockchain de Hive',
      'profile.voteFor': 'Votar por el Testigo',
      'profile.visitWebsite': 'Visitar Sitio Web',
      'profile.uptime': 'Tiempo de Actividad',
      'profile.reliability': 'Fiabilidad',
      'profile.reliability.desc': 'Un menor número de bloques perdidos indica mejor fiabilidad y tiempo de actividad.',
      'profile.failed': 'Error al cargar datos del testigo.',
      'profile.votersTitle': 'Votantes',
      'profile.witnessDescription': 'Descripción del Testigo',
      'profile.isWitness': 'es un testigo de Hive actualmente clasificado',
      'profile.withVotes': 'con',
      'profile.fromCommunity': 'de apoyo de la comunidad.',
      'profile.asWitness': 'Como testigo de Hive,',
      'profile.responsible': 'es responsable de validar transacciones, asegurar la blockchain y participar en decisiones de gobernanza de la blockchain.',
      'profile.elected': 'Los testigos son elegidos por los participantes de Hive y proporcionan infraestructura crítica para la operación de la blockchain Hive.',
      'profile.blockProduction': 'Producción de Bloques',
      'profile.hasProduced': 'Este testigo ha producido bloques hasta el número',
      'profile.andMissed': 'y ha perdido un total de',
      'profile.throughHistory': 'bloques a lo largo de su historia.',
      'profile.account': 'Cuenta',
      'profile.username': 'Nombre de usuario',
      'profile.ownHP': 'HP Propio',
      'profile.proxiedHP': 'HP Delegado',
      'profile.totalGov': 'Voto total de gobernanza',
      'profile.noVoters': 'No se encontraron votantes para este testigo.',
      
      // Modals
      'modal.login.title': 'Iniciar sesión con Hive Keychain',
      'modal.login.desc': 'Por favor, ingresa tu nombre de usuario de Hive para iniciar sesión con Keychain.',
      'modal.login.username': 'Nombre de usuario de Hive',
      'modal.login.enterUsername': 'Ingresa tu nombre de usuario',
      'modal.login.action': 'Iniciar sesión con Keychain',
      'modal.login.keychain': 'Se requiere Hive Keychain',
      'modal.login.keychainDesc': 'Necesitas instalar la extensión de navegador Hive Keychain para iniciar sesión.',
      'modal.login.install': 'Instalar Keychain',
      'modal.login.cancel': 'Cancelar',
      'modal.login.devMode': 'El modo de desarrollo está activo. Puedes iniciar sesión con cualquier nombre de usuario para pruebas.',
      'modal.login.logging': 'Iniciando sesión...',
      
      'modal.vote.title': 'Votar por Testigo',
      'modal.vote.desc': 'Estás a punto de votar por',
      'modal.vote.broadcast': 'Esta acción se transmitirá a la blockchain de Hive',
      'modal.vote.approval': 'Aprobación',
      'modal.vote.approve': 'Aprobar',
      'modal.vote.confirming': 'Confirmando...',
      'modal.vote.confirm': 'Confirmar Voto',
      'error': 'Error',
      'modal.vote.remove': 'Eliminar Voto',
      'modal.vote.cancel': 'Cancelar',
      'modal.vote.warning': 'Advertencia',
      'modal.vote.warningDesc': 'Solo puedes votar por hasta 30 testigos. Por favor, elimina un voto primero si has alcanzado tu límite.',
      
      'modal.proxy.title': 'Cuentas que han elegido a',
      'modal.proxy.desc': 'Estas cuentas han delegado su poder de voto de testigos a',
      'modal.proxy.desc2': 'Las relaciones de proxy pueden cambiar frecuentemente en la blockchain Hive.',
      'modal.proxy.undiscovered': 'Cuentas No Descubiertas',
      'modal.proxy.proxyPower': 'Poder de proxy total:',
      'modal.proxy.explanation': 'Esta cuenta tiene votos delegados, pero no pudimos identificar cuentas específicas. La blockchain Hive no proporciona una forma directa de consultar esta relación.',
      'modal.proxy.noAccounts': 'Actualmente no hay cuentas utilizando a',
      'modal.proxy.asProxy': 'como su proxy',
      'modal.proxy.relationships': 'Las relaciones de proxy en Hive pueden cambiar con el tiempo. Nuestro sistema utiliza múltiples métodos para encontrar relaciones de proxy, incluyendo consultas directas a la blockchain y datos en caché.',
      
      // About page
      'about.title': 'Acerca del Explorador de Testigos de Hive',
      'about.description': 'Una herramienta completa para explorar los testigos de la blockchain Hive.',
      'about.purpose': 'Propósito',
      'about.purposeDesc': 'Esta aplicación proporciona una manera fácil de descubrir, evaluar y votar por los testigos de Hive - los validadores de la blockchain que aseguran la red e implementan decisiones de gobernanza.',
      'about.features': 'Características',
      'about.feature1': 'Ver perfiles detallados de testigos',
      'about.feature2': 'Ver votantes de testigos y su influencia',
      'about.feature3': 'Explorar relaciones de proxy',
      'about.feature4': 'Votar por testigos de forma segura usando Hive Keychain',
      'about.tech': 'Tecnología',
      'about.techDesc': 'Construido con React, Vite e integrado con la blockchain Hive a través de llamadas API directas y autenticación Hive Keychain.',
      'about.mission': 'Empoderar a los usuarios de Hive con infraestructura blockchain confiable y gobernanza mientras se promueve la descentralización a través de la participación comunitaria.',
      
      // NotFound page
      'notFound.title': '404 Página No Encontrada',
      'notFound.message': '¿Olvidaste agregar la página al enrutador?',
      
      // User Stats page
      'userStats.title': 'Tus Estadísticas de Hive',
      'userStats.subtitle': 'Visualiza las estadísticas de tu cuenta Hive, métricas de poder y votos de testigos',
      'userStats.needLogin': 'Necesitas iniciar sesión con Hive Keychain para ver tus estadísticas',
      'userStats.witnessVotes': 'Votos de Testigos',
      'userStats.powerAnalysis': 'Análisis de Poder',
      'userStats.yourWitnessVotes': 'Tus Votos de Testigos',
      'userStats.noWitnessVotes': 'Aún no has votado por ningún testigo',
      'userStats.browseWitnesses': 'Explorar Testigos',
      'userStats.hivePowerBreakdown': 'Desglose de Poder de Hive',
      'userStats.effectiveHP': 'HP Efectivo',
      'userStats.effectiveHPDesc': 'Tu poder de Hive efectivo total incluyendo delegaciones entrantes/salientes',
      'userStats.ownHPDesc': 'Poder de Hive que pertenece directamente a tu cuenta',
      'userStats.proxiedHPDesc': 'Poder de Hive delegado a tu cuenta por otros usuarios',
      'userStats.governancePower': 'Poder de Gobernanza',
      'userStats.governancePowerDesc': 'Tu poder de voto para decisiones de gobernanza y votos de testigos (HP propio + HP delegado)',
      'userStats.proxyAccount': 'Cuenta Proxy',
      'userStats.proxyExplanation': 'Has delegado tu poder de voto de testigos a esta cuenta. Esto significa que pueden votar por testigos en tu nombre.',
      'userStats.viewProxyVotes': 'Ver Votos del Proxy',
      'userStats.viewStats': 'Ver Estadísticas',
      
      // Schedule page
      'schedule.title': 'Calendario de Producción de Bloques',
      'schedule.description': 'Vista en tiempo real del calendario de producción de bloques de los testigos de la blockchain Hive. Ve qué testigo está produciendo bloques actualmente y el orden de rotación próximo.',
      
      // Footer
      'footer.description': 'Apoyando el ecosistema de la blockchain Hive a través de operaciones de testigo confiables y desarrollo comunitario.',
      'footer.quickLinks': 'Enlaces Rápidos',
      'footer.aboutAliento': 'Acerca de Aliento',
      'footer.resources': 'Recursos',
      'footer.developerPortal': 'Portal de Desarrolladores',
      'footer.keychainSDK': 'SDK de Keychain',
      'footer.beaconAPI': 'API Beacon',
      'footer.blockExplorer': 'Explorador de Bloques',
      'footer.documentation': 'Documentación',
      'footer.copyright': 'Todos los derechos reservados.',
    }
  };

  const translate = (key: string, params?: Record<string, string | number>): string => {
    // Get translation or fallback to English or the key itself
    let translation = translations[language][key as keyof typeof translations[typeof language]];
    
    if (!translation && language !== 'en') {
      // If missing in current language, try English as fallback
      translation = translations['en'][key as keyof typeof translations['en']];
    }
    
    if (!translation) {
      // If all fails, return the key itself
      return key;
    }
    
    // If params provided, replace {{param}} placeholders
    if (params) {
      return Object.entries(params).reduce(
        (text, [param, value]) => text.replace(new RegExp(`{{${param}}}`, 'g'), String(value)),
        translation
      );
    }
    
    return translation;
  };

  // Update html lang attribute when language changes
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}