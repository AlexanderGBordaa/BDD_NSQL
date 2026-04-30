import { Hero } from "./models/Hero.js";
import { seedHeroes } from "./seedData.js";

export async function seed() {
  const count = await Hero.countDocuments();
  if (count > 0) {
    console.log(`Seed omitido: ya existen ${count} superhéroes en la base.`);
    return;
  }
  await Hero.insertMany(seedHeroes);
  console.log(`Seed inicial completo: ${seedHeroes.length} superhéroes cargados.`);
}
