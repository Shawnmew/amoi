import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

import worship from "@/assets/hero-worship.jpg";
import preaching from "@/assets/hero-preaching.jpg";
import choir from "@/assets/hero-choir.jpg";
import prayer from "@/assets/hero-prayer.jpg";
import baptism from "@/assets/hero-baptism.jpg";

export function convertGoogleDriveLink(url: string): string {
  if (!url) return url;
  
  // Se for um link de compartilhamento do Google Drive, extrai o ID do arquivo
  // e formata para o link de renderização direta da CDN do Google.
  if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
    const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch && fileDMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;
    }
    
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
    }
  }
  return url;
}

export interface CarouselSlide {
  id: string;
  src: string;
  title: string;
  subtitle: string;
  order: number;
}

export interface Announcement {
  id: string;
  title: string;
  category: string;
  content: string;
  date: string;
  imageUrl?: string;
  author: string;
}

export interface ChurchInfo {
  welcomeTitle: string;
  welcomeDesc: string;
  schedule: Array<{ day: string; time: string }>;
}

export const DEFAULT_SLIDES: CarouselSlide[] = [
  { id: "1", src: worship, title: "Adoração que Move o Céu", subtitle: "Cultos com a presença viva do Espírito Santo", order: 1 },
  { id: "2", src: preaching, title: "A Palavra que Transforma", subtitle: "Ensino bíblico sólido para todas as idades", order: 2 },
  { id: "3", src: choir, title: "Louvor de Vitória", subtitle: "Ministério de música ungido e vibrante", order: 3 },
  { id: "4", src: prayer, title: "Oração e Intercessão", subtitle: "Quebrando barreiras pelo poder do Espírito", order: 4 },
  { id: "5", src: baptism, title: "Vidas Renovadas", subtitle: "Celebramos novas conversões e batismos", order: 5 },
];

export const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-1",
    title: "Grande Campanha de Oração e Milagres",
    category: "Evento",
    content: "Junte-se a nós nesta semana especial onde clamaremos ao Senhor por curas, milagres e libertação. Teremos a participação de pastores convidados e momentos profundos de clamor.",
    date: "2026-07-12",
    author: "Pastor Nelson Nunes",
  },
  {
    id: "ann-2",
    title: "Abertura das Inscrições para o Encontro de Jovens",
    category: "Notícia",
    content: "Já estão abertas as inscrições para o Encontro de Jovens 'Arde 2026'. Vagas limitadas. Entre em contacto com a liderança de jovens para garantir o seu lugar.",
    date: "2026-07-08",
    author: "Líder de Jovens",
  }
];

export const DEFAULT_INFO: ChurchInfo = {
  welcomeTitle: "Uma casa de oração para todos os povos.",
  welcomeDesc: "A AMOI é mais do que uma igreja — é uma família espiritual que arde pela presença de Deus. Acreditamos no poder transformador da oração, na centralidade da Palavra e na adoração que move o coração do Pai.",
  schedule: [
    { day: "Domingo", time: "09h00 às 12h30 · Culto de Adoração" },
    { day: "Quarta-Feira", time: "18h00 às 19h00 · Culto de Libertação" },
    { day: "Sexta-Feira", time: "18h00 às 19h00 · Culto de Libertação" },
  ],
};

// ============ CAROUSEL SLIDES ============

export async function getDynamicSlides(): Promise<CarouselSlide[]> {
  try {
    if (db) {
      const q = query(collection(db, "carousel_slides"), orderBy("order", "asc"));
      const snap = await getDocs(q);
      const list: CarouselSlide[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as CarouselSlide);
      });
      if (list.length > 0) return list;
    }
  } catch (e) {
    console.error("Error loading slides from Firestore:", e);
  }

  // LocalStorage Fallback
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("amoi_carousel_slides");
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
  }
  return DEFAULT_SLIDES;
}

export async function saveDynamicSlides(slides: CarouselSlide[]): Promise<void> {
  // LocalStorage
  if (typeof window !== "undefined") {
    localStorage.setItem("amoi_carousel_slides", JSON.stringify(slides));
  }

  // Firestore
  try {
    if (db) {
      for (const s of slides) {
        await setDoc(doc(db, "carousel_slides", s.id), s);
      }
    }
  } catch (e) {
    console.error("Error saving slides to Firestore:", e);
  }
}

// ============ ANNOUNCEMENTS ============

export async function getDynamicAnnouncements(): Promise<Announcement[]> {
  try {
    if (db) {
      const q = query(collection(db, "announcements"), orderBy("date", "desc"));
      const snap = await getDocs(q);
      const list: Announcement[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Announcement);
      });
      if (list.length > 0) return list;
    }
  } catch (e) {
    console.error("Error loading announcements from Firestore:", e);
  }

  // LocalStorage Fallback
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("amoi_announcements");
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
  }
  return DEFAULT_ANNOUNCEMENTS;
}

export async function saveDynamicAnnouncement(ann: Announcement): Promise<void> {
  // LocalStorage
  if (typeof window !== "undefined") {
    const list = await getDynamicAnnouncements();
    const idx = list.findIndex(a => a.id === ann.id);
    if (idx >= 0) {
      list[idx] = ann;
    } else {
      list.unshift(ann);
    }
    localStorage.setItem("amoi_announcements", JSON.stringify(list));
  }

  // Firestore
  try {
    if (db) {
      await setDoc(doc(db, "announcements", ann.id), ann);
    }
  } catch (e) {
    console.error("Error saving announcement to Firestore:", e);
  }
}

export async function deleteDynamicAnnouncement(id: string): Promise<void> {
  // LocalStorage
  if (typeof window !== "undefined") {
    const list = await getDynamicAnnouncements();
    const updated = list.filter(a => a.id !== id);
    localStorage.setItem("amoi_announcements", JSON.stringify(updated));
  }

  // Firestore
  try {
    if (db) {
      await deleteDoc(doc(db, "announcements", id));
    }
  } catch (e) {
    console.error("Error deleting announcement from Firestore:", e);
  }
}

// ============ CHURCH INFO / PAGE CONTENT ============

export async function getDynamicInfo(): Promise<ChurchInfo> {
  try {
    if (db) {
      const snap = await getDocs(collection(db, "church_info"));
      let info: Partial<ChurchInfo> = {};
      snap.forEach((doc) => {
        if (doc.id === "general") {
          info = doc.data() as ChurchInfo;
        }
      });
      if (info.welcomeTitle) return info as ChurchInfo;
    }
  } catch (e) {
    console.error("Error loading info from Firestore:", e);
  }

  // LocalStorage Fallback
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("amoi_church_info");
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
  }
  return DEFAULT_INFO;
}

export async function saveDynamicInfo(info: ChurchInfo): Promise<void> {
  // LocalStorage
  if (typeof window !== "undefined") {
    localStorage.setItem("amoi_church_info", JSON.stringify(info));
  }

  // Firestore
  try {
    if (db) {
      await setDoc(doc(db, "church_info", "general"), info);
    }
  } catch (e) {
    console.error("Error saving info to Firestore:", e);
  }
}

// ============ USER MANAGEMENT ============

export type UserRole = "membro" | "Editor" | "Servo de Deus";

export interface ChurchUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  newsletter: boolean;
  phone?: string;
}

export async function getDynamicUsers(): Promise<ChurchUser[]> {
  try {
    if (db) {
      const snap = await getDocs(collection(db, "users"));
      const list: ChurchUser[] = [];
      snap.forEach((doc) => {
        list.push({ uid: doc.id, ...doc.data() } as ChurchUser);
      });
      if (list.length > 0) return list;
    }
  } catch (e) {
    console.error("Error loading users from Firestore:", e);
  }

  // LocalStorage Mock
  if (typeof window !== "undefined") {
    const mockDbStr = localStorage.getItem("amoi_mock_users_db");
    if (mockDbStr) {
      try {
        const parsed = JSON.parse(mockDbStr);
        return parsed.map((u: any, idx: number) => ({
          uid: u.uid || `mock-uid-${idx}`,
          email: u.email,
          displayName: u.name,
          role: u.role || "membro",
          newsletter: typeof u.newsletter === "boolean" ? u.newsletter : true,
          phone: u.phone || ""
        }));
      } catch {}
    }
  }
  return [];
}

export async function saveDynamicUser(user: ChurchUser): Promise<void> {
  // LocalStorage
  if (typeof window !== "undefined") {
    const mockDbStr = localStorage.getItem("amoi_mock_users_db");
    if (mockDbStr) {
      try {
        const dbList = JSON.parse(mockDbStr);
        const idx = dbList.findIndex((u: any) => u.email === user.email);
        if (idx >= 0) {
          dbList[idx] = {
            ...dbList[idx],
            name: user.displayName,
            role: user.role,
            newsletter: user.newsletter,
            phone: user.phone
          };
          localStorage.setItem("amoi_mock_users_db", JSON.stringify(dbList));
        }
      } catch {}
    }
  }

  // Firestore
  try {
    if (db) {
      await setDoc(doc(db, "users", user.uid), user, { merge: true });
    }
  } catch (e) {
    console.error("Error updating user in Firestore:", e);
  }
}

export async function deleteDynamicUser(uid: string, email: string): Promise<void> {
  // LocalStorage
  if (typeof window !== "undefined") {
    const mockDbStr = localStorage.getItem("amoi_mock_users_db");
    if (mockDbStr) {
      try {
        const dbList = JSON.parse(mockDbStr);
        const updated = dbList.filter((u: any) => u.email !== email);
        localStorage.setItem("amoi_mock_users_db", JSON.stringify(updated));
      } catch {}
    }
  }

  // Firestore
  try {
    if (db) {
      await deleteDoc(doc(db, "users", uid));
    }
  } catch (e) {
    console.error("Error deleting user from Firestore:", e);
  }
}

