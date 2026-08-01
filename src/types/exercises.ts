/** Exercise swap groups — the workout mirror of seed/substitutions.json. */

export interface ExerciseOption {
  exerciseId: string;
  label: string;
  /** Muscle groups this actually trains, primary first. Shown to the member. */
  targets: string[];
  /** Usually the reason a swap is needed at all: the rack is busy. */
  equipment: string;
  placeholder?: boolean;
  note?: string;
}

export interface ExerciseGroup {
  groupId: string;
  /** Movement pattern, not a muscle name. */
  label: string;
  placeholder?: boolean;
  members: ExerciseOption[];
}
