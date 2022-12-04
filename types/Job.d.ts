interface Job {
  id: string;
  row: string;
  ml: boolean;
  order: number;
  name: {
    [key: string]: string;
    en: string;
    ja: string;
  };
  proficiency: {
    proficiency1: number;
    proficiency2: number;
  };
  base_job?: Job;
}
