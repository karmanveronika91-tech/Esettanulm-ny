import { CustomerServicePillar } from '../types';

export const DEFAULT_CUSTOMER_STANDARDS: CustomerServicePillar[] = [
  {
    id: 'pillar-1',
    title: 'Ügyfélközpontúság',
    category: 'Alapvető Ügyfélszolgálati Attitűd',
    description: 'Minden ügyfélmegkeresésre visszajelzést adunk, egyértelműen és érthetően kommunikálunk, panasz esetén a megoldásra fókuszálunk.',
    isActive: true,
    subPoints: [
      {
        id: 'p1-1',
        title: 'Visszajelzés minden megkeresésre',
        description: 'Az e-mailt vagy kérést akkor sem hagyjuk válasz nélkül, ha még nincs kész megoldás. Röviden jelezzük, hogy megkaptuk, s megadjuk, mikorra várható a következő információ. Konkrét, ellenőrizhető vállalást teszünk.',
      },
      {
        id: 'p1-2',
        title: 'Egyértelmű folyamatkommunikáció',
        description: 'Világosan kommunikáljuk, mi történt, mi következik, ki foglalkozik az üggyel. Kerüljük a bizonytalan kifejezéseket: "folyamatban van", "hamarosan jelentkezünk".',
      },
      {
        id: 'p1-3',
        title: 'Érthető és lényegre törő megfogalmazás',
        description: 'Kerüljük a szakzsargont, a belső rövidítéseket és a felesleges magyarázatokat. Mindig azt az információt adjuk át, ami segíti a megértést.',
      },
      {
        id: 'p1-4',
        title: 'Panasz esetén megoldásfókusz',
        description: 'Meghallgatjuk az ügyfelet, elismerjük az okozott kellemetlenséget, és a megoldásra/kárenyhítésre törekszünk.',
      },
      {
        id: 'p1-5',
        title: 'Ügyfélre gyakorolt hatás mérlegelése',
        description: 'Mérlegeljük, hogy döntéseink mennyi várakozást, bizonytalanságot vagy többletmunkát okoznak az ügyfélnek.',
      },
    ],
  },
  {
    id: 'pillar-2',
    title: 'Proaktivitás és Felelősségvállalás',
    category: 'Proaktivitás',
    description: 'Az ügyet a megoldásig sajátunknak tekintjük, nem várjuk meg míg a probléma az ügyfélnél kopogtat, s alternatívákat kínálunk.',
    isActive: true,
    subPoints: [
      {
        id: 'p2-1',
        title: 'Ügy sajátként kezelése lezárásig',
        description: 'Nem tekintjük lezártnak az ügyet csak azért, mert továbbítottuk egy kollégának. Nyomon követjük a teljes folyamatot.',
      },
      {
        id: 'p2-2',
        title: 'Proaktív hibajelzés és megelőzés',
        description: 'Ha látjuk, hogy valami nem a tervek szerint alakul, időben jelezzük – megoldási javaslattal együtt.',
      },
      {
        id: 'p2-3',
        title: 'Felelősségvállalás hibázáskor',
        description: 'Nem hárítjuk a felelősséget másra. Elnézést kérünk, ismertetjük a javító intézkedést és a megelőzést.',
      },
      {
        id: 'p2-4',
        title: 'Megoldási alternatívák kínálása',
        description: 'Ha az eredeti kérés nem teljesíthető, elmagyarázzuk az okát, reális határidőt adunk és alternatívát javaslunk.',
      },
    ],
  },
  {
    id: 'pillar-3',
    title: 'Együttműködés és Csapatszellem',
    category: 'Belső és Külső Együttműködés',
    description: 'Nem kérjük be többször ugyanazt az adatot, tisztelettel kommunikálunk és tudatosítjuk, hogy a belső együttműködés minősége látható az ügyfélnek.',
    isActive: true,
    subPoints: [
      {
        id: 'p3-1',
        title: 'Adatok többszöri bekérésének kerülése',
        description: 'Mielőtt adatot kérünk, ellenőrizzük, hogy az már rendelkezésünkre áll-e vagy belső egyeztetéssel beszerezhető-e.',
      },
      {
        id: 'p3-2',
        title: 'Tiszteletteljes kommunikáció',
        description: 'Akkor sem válunk türelmetlenné vagy védekezővé, ha az ügyfél elégedetlen.',
      },
      {
        id: 'p3-3',
        title: 'Közös felelősség az ügyfélélményért',
        description: 'Minden munkatárs felelős azért, hogy döntései hogyan hatnak az ügyfélélményre.',
      },
    ],
  },
  {
    id: 'pillar-4',
    title: 'Tudásközpontúság és Szakmai Tapasztalat',
    category: 'Szakmaiság',
    description: 'Pontosan megértjük az ügyfél igényét kérdések tisztázásával, s az ügyeket az üzleti hatás alapján priorizáljuk.',
    isActive: true,
    subPoints: [
      {
        id: 'p4-1',
        title: 'Pontos igényfelmérés',
        description: 'Nem feltételezések alapján dolgozunk. Kérdésekkel tisztázzuk az elvárt eredményt, sürgősséget és fontos szempontokat.',
      },
      {
        id: 'p4-2',
        title: 'Üzleti hatás alapú priorizálás',
        description: 'Figyelembe vesszük a probléma következményeit, kockázatát és az ügyfél működésére gyakorolt hatását.',
      },
    ],
  },
  {
    id: 'pillar-5',
    title: 'Folyamatos Fejlődés',
    category: 'Minőségfejlesztés',
    description: 'A hibák kiváltó okát szüntetjük meg, s rendszeresen visszajelzést kérünk.',
    isActive: true,
    subPoints: [
      {
        id: 'p5-1',
        title: 'Rendszerszintű okmegszüntetés',
        description: 'Megvizsgáljuk a kiváltó okokat, s a visszatérő problémákat rendszerszinten kezeljük.',
      },
    ],
  },
  {
    id: 'pillar-6',
    title: 'Törvényes Működés',
    category: 'Compliance & Jogszabályi Megfelelőség',
    description: 'Nem mondunk mindenre igent, ha az jogszabályba, szerződésbe vagy szakmai szabályba ütközik – ezt őszintén s érthetően kommunikáljuk alternatívával.',
    isActive: true,
    subPoints: [
      {
        id: 'p6-1',
        title: 'Jogszabályi és szakmai határok tiszteletben tartása',
        description: 'Ha a kérés jogszabályba ütközik, ezt őszintén és érthetően kommunikáljuk, reális vállalást teszünk, s alternatívát kínálunk.',
      },
    ],
  },
];
