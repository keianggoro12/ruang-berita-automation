import { faker } from '@faker-js/faker';

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateAngle(): string {
  const patterns = [
    () => `${faker.company.catchPhraseAdjective()} ${faker.company.catchPhraseNoun()} ${faker.company.buzzVerb()} ${faker.location.city()}`,
    () => `${faker.person.jobTitle()} bahas ${faker.company.buzzNoun()} terkait ${faker.commerce.product()}`,
    () => `Dampak ${faker.company.catchPhrase()} terhadap ${faker.commerce.department()}`,
    () => `${faker.company.catchPhraseAdjective()} ${faker.company.catchPhraseNoun()} dari ${faker.company.name()}`,
    () => `${faker.commerce.department()} hadapi ${faker.company.buzzAdjective()} ${faker.company.buzzNoun()}`,
    () => `${faker.company.buzzVerb()} ${faker.company.buzzAdjective()} ${faker.commerce.product()} di ${faker.location.state()}`,
    () => `Temuan ${faker.company.catchPhraseAdjective()} terkait ${faker.commerce.productAdjective()} ${faker.commerce.product()}`,
    () => `${faker.company.catchPhrase()} ${faker.company.buzzVerb()} ${faker.location.city()}`,
    () => `Isu ${faker.company.buzzAdjective()} ${faker.company.catchPhraseNoun()} oleh ${faker.person.jobTitle()}`,
    () => `${faker.commerce.productAdjective()} ${faker.commerce.product()} ${faker.company.buzzVerb()} ${faker.person.jobArea()}`,
  ];

  return pickRandom(patterns)();
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateLatarBelakang(angle: string): string {
  const paragraphs: string[] = [];
  const numParagraphs = rand(2, 4);

  for (let i = 0; i < numParagraphs; i++) {
    const numSentences = rand(3, 5);
    const sentences: string[] = [];

    sentences.push(faker.lorem.sentence({ min: 10, max: 20 }));

    for (let j = 1; j < numSentences; j++) {
      sentences.push(faker.lorem.sentence({ min: 8, max: 18 }));
    }

    paragraphs.push(sentences.join(' '));
  }

  return paragraphs.join('\n\n');
}

export function generateNarasumber(): { nama: string; jabatan: string; kontak: string }[] {
  const count = rand(1, 5);
  const sources: { nama: string; jabatan: string; kontak: string }[] = [];

  for (let i = 0; i < count; i++) {
    const nama = faker.person.fullName();
    const jabatan = `${faker.person.jobTitle()}, ${faker.company.name()}`;
    const kontak = generatePhone();
    sources.push({ nama, jabatan, kontak });
  }

  return sources;
}

export function generatePhone(): string {
  const prefix = pickRandom(['0812', '0813', '0821', '0822', '0852', '0853', '0878', '0811', '0856', '0857']);
  return `${prefix}${faker.string.numeric(7)}`;
}

export function generateUniqueEmail(): string {
  return `${faker.internet.username().toLowerCase()}${Date.now()}@testmail.com`;
}

export function randomString(length: number = 8): string {
  return faker.string.alphanumeric(length);
}

export function randomParagraph(sentences: number = 3): string {
  return faker.lorem.paragraph(sentences);
}

export function randomHeadline(): string {
  return faker.lorem.sentence(8);
}