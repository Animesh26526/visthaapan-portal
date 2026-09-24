export type SupportedLanguage =
  | 'en'
  | 'hi'
  | 'bn'
  | 'te'
  | 'mr'
  | 'ta'
  | 'gu'
  | 'ur'
  | 'kn'
  | 'or'
  | 'ml'
  | 'pa'
  | 'as';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
];

export interface TranslationDictionary {
  // Portal metadata
  portalTitle: string;
  portalSubtitle: string;
  governmentBadge: string;
  districtBadge: string;

  // Navbar Menu Items
  navOperations: string;
  navPlanning: string;
  navScenario: string;
  navDecisions: string;
  navIntelligence: string;

  // Submenu items
  opCommandCenter: string;
  opGis: string;
  opHabitations: string;
  opRiskIntel: string;

  planCapacity: string;
  planAllocation: string;
  planWhy: string;
  planRelocation: string;

  scenPlanner: string;
  scenGis: string;
  scenResults: string;

  decCurrentPlan: string;
  decReview: string;
  decPreviousPlans: string;
  decAudit: string;

  intelAnalytics: string;
  intelEvidence: string;
  intelQuality: string;
  intelOverview: string;

  // Ticker prefixes
  tickerCriticalAlert: string;
  tickerWeather: string;
  tickerRoad: string;
  tickerShelter: string;
  tickerStatus: string;

  // Common UI Actions
  btnApplyMain: string;
  btnCancelScenario: string;
  btnReoptimize: string;
  btnAcceptPlan: string;
  btnModifyPlan: string;
  btnRejectPlan: string;
  btnTour: string;
  btnInstall: string;
  btnListenBrief: string;
  btnPause: string;
  btnResume: string;
  btnStop: string;
  btnReplay: string;
  btnLogin: string;
  btnLogout: string;

  // Statuses & Badges
  statusImmediate: string;
  statusStandby: string;
  statusOptimal: string;
  statusFeasible: string;
  statusBlocked: string;
  statusPassable: string;
  statusActivePlan: string;
}
