import seedData from "./seed/weapons.json";
import type { Weapon } from "@/lib/client/types";

type Store = {
  weapons: Weapon[];
};

const store: Store = {
  weapons: seedData as Weapon[],
};

export const getStore = (): Store => store;

export const getAllWeapons = (): Weapon[] => store.weapons;

export const getWeaponBySlug = (slug: string): Weapon | undefined =>
  store.weapons.find((w) => w.slug === slug);
