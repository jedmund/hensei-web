export interface SkillGroup {
  id: number;
  name: {
    [key: string]: string;
    en: string;
    ja: string;
  };
}

export const skillClassification: SkillGroup[] = [
  {
    id: 0,
    name: {
      en: "Buffing",
      ja: "強化アビリティ",
    },
  },
  {
    id: 1,
    name: {
      en: "Debuffing",
      ja: "弱体アビリティ",
    },
  },
  {
    id: 2,
    name: {
      en: "Damaging",
      ja: "ダメージアビリティ",
    },
  },
  {
    id: 3,
    name: {
      en: "Healing",
      ja: "回復アビリティ",
    },
  },
  {
    id: 4,
    name: {
      en: "Field",
      ja: "フィールドアビリティ",
    },
  },
];

export const skillGroups: SkillGroup[] = [
  {
    id: 0,
    name: {
      en: "Buffing",
      ja: "強化アビリティ",
    },
  },
  {
    id: 1,
    name: {
      en: "Debuffing",
      ja: "弱体アビリティ",
    },
  },
  {
    id: 2,
    name: {
      en: "Damaging",
      ja: "ダメージアビリティ",
    },
  },
  {
    id: 3,
    name: {
      en: "Healing",
      ja: "回復アビリティ",
    },
  },
  {
    id: 4,
    name: {
      en: "Extended Mastery",
      ja: "リミットアビリティ",
    },
  },
  {
    id: 5,
    name: {
      en: "Base",
      ja: "ベースアビリティ",
    },
  },
];
