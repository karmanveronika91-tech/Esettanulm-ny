import { CaseStudy } from '../types';

export const DEFAULT_CASE_STUDIES: CaseStudy[] = [
  {
    id: 'case-1',
    caseNumber: 1,
    title: 'Hazautazás a vendégmunkás-engedély hosszabbítása alatt',
    category: 'Munkajog & Külföldi munkavállalók',
    isDefault: true,
    description: `A Fülöp-szigeteki munkavállalók jelenleg is a partnercég alkalmazásában állnak. Mivel kétéves munkaszerződésük és tartózkodási engedélyük lejárathoz közeledik, egyeztettünk a partnercéggel, ahonnan azt a visszajelzést kaptuk, hogy szeretnék meghosszabbítani a munkaviszonyukat, mert meg vannak velük elégedve, ezért kezdeményeztük a szerződésük meghosszabbításához szükséges Vendégmunkás tartózkodási engedélyek kérelmezését.

A munkavállalók már megkapták a Vendégmunkás tájékoztató engedélyt papír alapon, azonban a plasztikkártyák kiállítása még folyamatban van. A kétéves foglalkoztatási időszak lejártával egyszeri hazautazásra is jogosultak.`,
    taskQuestions: `1. Hazautazhat-e a munkavállaló?
2. Milyen belső és külső szabályokra kell figyelni?
3. Milyen nyomtatványokat kell kitölteni az utazás előtt?
4. Mely jogszabályok irányadók?`,
    communicationFocus: `Címzett: Érintett Fülöp-szigeteki munkavállalók
Kommunikációs fókusz: Közérthető tájékoztatás és egyértelmű teendők
Írj tájékoztató e-mailt a munkavállalóknak a tervezett hazautazás feltételeiről. A levélből pontosan derüljön ki, hogy mikor foglalható biztonsággal repülőjegy, és mit kell az indulás előtt elintézniük.

Az e-mail térjen ki az alábbiakra:
• miért szükséges az érvényes plasztik tartózkodási kártya a visszautazáshoz;
• miért nem jelent önmagában elegendő igazolást a papíralapú tájékoztató engedély;
• milyen határellenőrzési és légitársasági kockázat merülhet fel a kártya hiányában;
• milyen belső nyilatkozatokat és esetleges partner-specifikus dokumentumokat kell kitölteni;
• kihez fordulhatnak kérdéssel, és mi legyen a következő konkrét lépésük.`,
    solutionGuide: `A vendégmunkás tájékoztató megléte önmagában nem elég a munkavállalók hazautazásához, rendelkezni kell a munkavállalónak minden esetben egy érvényes plasztik kártyával. A határrendészet ellenőrzi, hogy főleg a visszautazásnál rendelkezzen érvényes plasztik tartózkodási engedéllyel. Abban az esetben amennyiben fizikailag nincs a munkavállalónál a kártya dönthet úgy a határ rendész, hogy nem engedi fel a repülőgépre. A hosszabbításoknál érdemes megvárni az új kártya meglétét és ezután rendelni a repülőjegyeket.

Kivételes eset a kártyák kipostázása a Fülöp-szigetekre, lehetőség szerint kerüljük el ezt a megoldást.`,
    sampleEmailTemplate: `Tisztelt Munkavállalók! Dear Employees,

Ezúton szeretnénk fontos és hivatalos tájékoztatást nyújtani a kétéves munkaszerződésetekhez kapcsolódó hazautazási szabadságról és a vendégmunkás tartózkodási engedélyek meghosszabbítási eljárásáról.

1. TARTÓZKODÁSI ENGEDÉLY ÉS VISSZAUTAZÁS:
A hatóságtól kapott papíralapú tájékoztató igazolás kizárólag Magyarország területén jogosít jogszerű tartózkodásra és munkavégzésre. A Fülöp-szigetekről Magyarországra történő visszautazáshoz a nemzetközi határrendészet és a légitársaságok KIZÁRÓLAG az érvényes fizikai plasztikkártyát fogadják el!

2. REPÜLŐJEGY VÁSÁRLÁSA:
Kérjük, hogy repülőjegyet semmilyen körülmények között NE vásároljatok meg addig, amíg az új fizikai plasztikkártya kézhezvétele meg nem történt! Amennyiben a plasztikkártya nélkül utaztok el, a légitársaság megtagadja a felszállást a visszautazáskor, és nem tudtok visszatérni munkahelyetekre.

3. TEENDŐK ÉS NYOMTATVÁNYOK AZ INDULÁS ELŐTT:
• A tervezett szabadság előtt kötelező kitölteni a "Repülőjegy visszavonás nyilatkozat szabadság utáni/hazautazási repülőjegyhez" című belső nyomtatványt.
• Egyeztetni kell a közvetlen műszakvezetővel és a kijelölt koordinátorral a pontos távolléti időszakról.

Amint a Bevándorlási Hivatal kiállítja és megküldi a fizikai kártyákat, azonnal értesítünk benneteket a személyes átvételről.

Kérdés esetén forduljatok bizalommal a kijelölt koordinátorhoz!

Üdvözlettel:
Nemzetközi HR Csapat`,
    legalAndForms: `Kitöltendő belső dokumentumok:
• Repülőjegy visszavonás nyilatkozat szabadság utáni/ hazautazási repülőjegyhez
• Egyéb specifikus, partner által kért nyilatkozat (ha van)

Jogszabályi háttér a megoldáshoz:
• Fülöp-szigeteki szabályozás alapján a munkavállaló utazását a munkaviszony megkezdésekor, beutazáskor, valamint a munkaviszony végén, hazautazáskor köteles téríteni a munkáltató. Ennek egy kivételes esete, amikor hosszabbítást kap egy adott munkavállaló. Ilyenkor a Fülöp-szigeteki hatóságok szempontjából Ő egy új munkaviszony kezd, hiába szerződésmódosítással kerül rendezésre.
• 2023. évi XC. törvény, a harmadik ország állampolgárainak Magyarországra történő belépésének és tartózkodásának általános szabályairól (Btátv)
• 450/2024 (XII 23.) Korm. rendelet A vendégmunkások Magyarországon történő foglalkoztatásáról`,
  },
  {
    id: 'case-2',
    caseNumber: 2,
    title: 'Betegszabadság és táppénz bejelentési eljárás téves ügyféltájékoztatása',
    category: 'Munkajog & Ügyfélszolgálat',
    description: `Egy kölcsönzött munkavállaló meglátogatta az orvosát és keresőképtelen állományba került. Ezt azonban csak 5 nappal később jelezte a felelős koordinátornak, mondván, hogy "az orvosi igazolást majd a gyógyulás után adja át". A partnercég csoportvezetője emiatt igazolatlan hiányzásként könyvelte el a napokat, és panaszt tett.`,
    taskQuestions: `1. Milyen kötelezettségei vannak a munkavállalónak betegség esetén?
2. Milyen határidők vonatkoznak a bejelentésre és az igazolások leadására?
3. Hogyan kell tájékoztatni a munkavállalót és a partnercéget az eljárásrendről?`,
    communicationFocus: `Címzett: Érintett munkavállaló és Partnercég csoportvezetője
Kommunikációs fókusz: Tények tisztázása, elnézéskérés az esetleges félreértésért, konstruktív eljárási tájékoztató és határozott teendők a hiányzás rendezésére.`,
    solutionGuide: `A keresőképtelenséget a munkavállalónak haladéktalanul (legkésőbb az első munkanap kezdetéig) jeleznie kell a közvetlen felettesének és a kölcsönző koordinátornak. Az orvosi igazolást (szabványos 'orvosi igazolás keresőképtelenségről' nyomtatvány) haladéktalanul, de legkésőbb 3 munkanapon belül be kell mutatni.
A koordinátornak meg kell hallgatnia az ügyfelet, tisztáznia a helyzetet, és azonnali pótlási lehetőséget kell adnia (orvostól visszamenőleges igazolási igénylés), hogy az igazolatlan hiányzás módosításra kerülhessen.`,
    sampleEmailTemplate: `Tisztelt Csoportvezető Úr! Kedves Partnerünk!

Köszönjük a jelzést a keresőképtelenségi bejelentéssel kapcsolatban. Elnézést kérünk az ügyviteli késedelemből fakadó félreértésért és kellemetlenségért.

Kollégánkkal egyeztettünk: orvosi vizsgálaton vett részt, és valóban keresőképtelen állományba került, azonban a leadási határidővel kapcsolatban téves információval rendelkezett. 

A helyzet mielőbbi és szabályos rendezésére az alábbi azonnali intézkedéseket tettük:
1. Felvettük a kapcsolatot a munkavállaló háziorvosával a hivatalos orvosi igazolás haladéktalan, elektronikus / személyes kiállítása és átadása érdekében.
2. Kitöltöttük a belső 'Keresőképtelenségi bejelentő' nyomtatványt, és benyújtjuk a 'Jelenléti ív korrekciós kérelmet', hogy a hiányzás igazolt betegszabadságként / táppénzként kerüljön rögzítésre az igazolatlan státusz helyett.
3. A munkavállalót írásban tájékoztattuk a Munka Törvénykönyve szerinti haladéktalan bejelentési kötelezettségről az elkövetkező esetekre.

Kérem, tekintse át a mellékelt korrekciós kérelmet. Bármilyen további kérdés esetén személyesen állok rendelkezésére!

Üdvözlettel:
Ügyfélszolgálati és Kölcsönzési Csapat`,
    legalAndForms: `Kitöltendő belső dokumentumok:
• Keresőképtelenségi bejelentő nyomtatvány
• Jelenléti ív korrekciós kérelem

Jogszabályi háttér:
• Mt. (2012. évi I. törvény) a munkavállaló együttműködési és tájékoztatási kötelezettségéről
• 1997. évi LXXXIII. törvény a kötelező egészségbiztosítás ellátásairól`,
  },
];
