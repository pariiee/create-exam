/**
 * All available class options grouped by level.
 */
export const kelasOptions: Record<string, string[]> = {
  X: [
    "X AKL 1", "X AKL 2", "X AKL 3", "X AKL 4",
    "X DKV 1", "X DKV 2", "X DKV 3",
    "X MPLB 1", "X MPLB 2", "X MPLB 3",
    "X PM 1", "X PM 2", "X PM 3",
    "X PPLG",
    "X TJKT 1", "X TJKT 2",
  ],
  XI: [
    "XI AK 1", "XI AK 2", "XI AK 3", "XI AK 4",
    "XI BD",
    "XI BR 1", "XI BR 2",
    "XI DKV 1", "XI DKV 2", "XI DKV 3",
    "XI MP 1", "XI MP 2", "XI MP 3",
    "XI RPL",
    "XI TKJ 1", "XI TKJ 2",
  ],
  XII: [
    "XII AK 1", "XII AK 2", "XII AK 3", "XII AK 4",
    "XII BD",
    "XII BR 1", "XII BR 2",
    "XII DKV 1", "XII DKV 2", "XII DKV 3",
    "XII MP 1", "XII MP 2", "XII MP 3",
    "XII RPL",
    "XII TKJ 1", "XII TKJ 2",
  ],
};

export const allKelas: string[] = Object.values(kelasOptions).flat();
