type JobSkillObject = {
  [key: number]: JobSkill | undefined;
  0: JobSkill | undefined;
  1: JobSkill | undefined;
  2: JobSkill | undefined;
  3: JobSkill | undefined;
};

interface Party {
  id: string;
  name: string;
  description: string;
  raid: Raid;
  job: Job;
  job_skills: JobSkillObject;
  shortcode: string;
  extra: boolean;
  favorited: boolean;
  characters: Array<GridCharacter>;
  weapons: Array<GridWeapon>;
  summons: Array<GridSummon>;
  user: User;
  created_at: string;
  updated_at: string;
}
