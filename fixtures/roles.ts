export interface RoleCredential {
  email: string;
  password: string;
}

export const roles: Record<string, RoleCredential> = {
  reporter: {
    email: process.env.REPORTER_EMAIL || '',
    password: process.env.REPORTER_PASSWORD || '',
  },
  editorMuda: {
    email: process.env.EDITOR_MUDA_EMAIL || '',
    password: process.env.EDITOR_MUDA_PASSWORD || '',
  },
  editorMadya: {
    email: process.env.EDITOR_MADYA_EMAIL || '',
    password: process.env.EDITOR_MADYA_PASSWORD || '',
  },
  editorSenior: {
    email: process.env.EDITOR_SENIOR_EMAIL || '',
    password: process.env.EDITOR_SENIOR_PASSWORD || '',
  },
  fotografer: {
    email: process.env.FOTOGRAFER_EMAIL || '',
    password: process.env.FOTOGRAFER_PASSWORD || '',
  },
  redakturBahasa: {
    email: process.env.REDAKTUR_BAHASA_EMAIL || '',
    password: process.env.REDAKTUR_BAHASA_PASSWORD || '',
  },
  desainer: {
    email: process.env.DESAINER_EMAIL || '',
    password: process.env.DESAINER_PASSWORD || '',
  },
  prodik: {
    email: process.env.PRODIK_EMAIL || '',
    password: process.env.PRODIK_PASSWORD || '',
  },
  penulisLuar: {
    email: process.env.PENULIS_LUAR_EMAIL || '',
    password: process.env.PENULIS_LUAR_PASSWORD || '',
  },
  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL || '',
    password: process.env.SUPER_ADMIN_PASSWORD || '',
  },
};
