import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, addDoc, getDoc } from "firebase/firestore";
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

export const DEFAULT_ANNOUNCEMENTS: Announcement[] = [];

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
      if (list.length > 0) {
        if (typeof window !== "undefined") {
          localStorage.setItem("amoi_carousel_slides", JSON.stringify(list));
        }
        return list;
      }
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
      if (list.length > 0) {
        if (typeof window !== "undefined") {
          localStorage.setItem("amoi_announcements", JSON.stringify(list));
        }
        return list;
      }
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
      if (info.welcomeTitle) {
        if (typeof window !== "undefined") {
          localStorage.setItem("amoi_church_info", JSON.stringify(info));
        }
        return info as ChurchInfo;
      }
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

export async function queueNewsletterEmail(
  title: string,
  category: string,
  content: string,
  author: string,
  imageUrl: string | undefined,
  recipients: string[]
): Promise<{ success: boolean; mock?: boolean; error?: string }> {
  if (recipients.length === 0) return { success: true, mock: true };

  // If Firebase is NOT active (no db), mock the dispatch
  if (!db) {
    console.log("\n=========================================");
    console.log("MOCK NEWSLETTER EMAIL QUEUED (No Firebase)");
    console.log(`To: ${recipients.join(", ")}`);
    console.log(`Subject: [AMOI] ${category}: ${title}`);
    console.log("=========================================\n");
    return { success: true, mock: true };
  }

  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #D4A017; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #D4A017; margin: 0; font-family: Georgia, serif; font-size: 26px;">AMOI</h2>
        <p style="color: #666; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Associação Ministério de Oração e Intercessão</p>
      </div>
      
      <span style="display: inline-block; padding: 4px 10px; font-size: 10px; font-weight: bold; background-color: rgba(212,160,23,0.15); color: #D4A017; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid rgba(212,160,23,0.3); margin-bottom: 15px;">
        ${category}
      </span>
      
      <h1 style="color: #111; font-size: 22px; margin: 0 0 15px 0;">${title}</h1>
      
      <p style="color: #444; font-size: 14px; line-height: 1.6; margin-bottom: 20px; white-space: pre-wrap;">
        ${content}
      </p>
      
      ${imageUrl ? `
        <div style="margin: 20px 0; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; max-height: 300px;">
          <img src="${imageUrl}" alt="${title}" style="width: 100%; height: auto; max-height: 300px; object-fit: cover; display: block;" />
        </div>
      ` : ""}
      
      <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 25px; color: #888; font-size: 11px;">
        <p style="margin: 0;">Publicado por: <strong>${author}</strong></p>
        <p style="margin: 5px 0 0 0;">Esta é uma notificação automática para os membros registados da AMOI. Se deseja cancelar a receção de comunicações, atualize as suas preferências no seu perfil de membro no portal.</p>
      </div>
    </div>
  `;

  try {
    await addDoc(collection(db, "mail"), {
      to: recipients,
      message: {
        subject: `[AMOI] ${category}: ${title}`,
        html: htmlBody,
      }
    });
    return { success: true };
  } catch (e: any) {
    console.error("Error queueing email in Firestore:", e);
    return { success: false, error: e.message || "Failed to queue email in Firestore" };
  }
}

export interface WhatsAppSettings {
  gatewayType: "link" | "zapi" | "twilio";
  zapiUrl?: string;
  zapiToken?: string;
  twilioSid?: string;
  twilioToken?: string;
  twilioFrom?: string;
}

export async function getWhatsAppSettings(): Promise<WhatsAppSettings> {
  // LocalStorage Fallback
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("amoi_whatsapp_settings");
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
  }

  try {
    if (db) {
      const docSnap = await getDoc(doc(db, "settings", "whatsapp"));
      if (docSnap.exists()) {
        const data = docSnap.data() as WhatsAppSettings;
        if (typeof window !== "undefined") {
          localStorage.setItem("amoi_whatsapp_settings", JSON.stringify(data));
        }
        return data;
      }
    }
  } catch (e) {
    console.error("Error loading WhatsApp settings from Firestore:", e);
  }
  return { gatewayType: "link" };
}

export async function saveWhatsAppSettings(settings: WhatsAppSettings): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.setItem("amoi_whatsapp_settings", JSON.stringify(settings));
  }

  try {
    if (db) {
      await setDoc(doc(db, "settings", "whatsapp"), settings);
    }
  } catch (e) {
    console.error("Error saving WhatsApp settings to Firestore:", e);
    throw e;
  }
}

// ============ VIDEOS & CULTOS MANAGEMENT ============

export interface ChurchVideo {
  id: string;
  title: string;
  speaker: string;
  date: string;
  category: "Pregação" | "Louvor" | "Vigília" | "Especial";
  type: "youtube" | "short";
  youtubeId?: string;
  shortUrl?: string;
}

export async function getDynamicVideos(): Promise<ChurchVideo[]> {
  try {
    if (db) {
      const snap = await getDocs(collection(db, "videos"));
      const list: ChurchVideo[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ChurchVideo);
      });
      list.sort((a, b) => b.date.localeCompare(a.date));
      if (list.length > 0) {
        if (typeof window !== "undefined") {
          localStorage.setItem("amoi_mock_videos_db", JSON.stringify(list));
        }
        return list;
      }
    }
  } catch (e) {
    console.error("Error loading videos from Firestore:", e);
  }

  // LocalStorage fallback for Mock Mode
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("amoi_mock_videos_db");
    if (local) {
      try {
        const parsed = JSON.parse(local) as ChurchVideo[];
        parsed.sort((a, b) => b.date.localeCompare(a.date));
        return parsed;
      } catch {}
    } else {
      const defaultVideos: ChurchVideo[] = [
        { id: "v1", title: "O Poder da Oração Persistente", speaker: "Pastor Nelson Nunes", date: "2026-06-15", category: "Pregação", type: "youtube", youtubeId: "9K_BRUFp8qg" },
        { id: "v2", title: "Vigília — Quebrando Barreiras", speaker: "Equipa de Intercessão", date: "2026-06-13", category: "Vigília", type: "youtube", youtubeId: "dQw4w9WgXcQ" },
        { id: "v3", title: "Louvor ao Trono — Ao Vivo", speaker: "Ministério de Louvor", date: "2026-06-08", category: "Louvor", type: "youtube", youtubeId: "dQw4w9WgXcQ" },
        { id: "v4", title: "Clips - Louvor Ungido", speaker: "Ministério de Louvor", date: "2026-06-05", category: "Louvor", type: "short", shortUrl: "https://www.youtube.com/shorts/9K_BRUFp8qg" }
      ];
      localStorage.setItem("amoi_mock_videos_db", JSON.stringify(defaultVideos));
      return defaultVideos;
    }
  }
  return [];
}

export async function saveDynamicVideo(video: ChurchVideo): Promise<void> {
  // LocalStorage Mock
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("amoi_mock_videos_db");
    let list: ChurchVideo[] = [];
    if (local) {
      try {
        list = JSON.parse(local);
      } catch {}
    }
    const idx = list.findIndex((v) => v.id === video.id);
    if (idx >= 0) {
      list[idx] = video;
    } else {
      list.push(video);
    }
    localStorage.setItem("amoi_mock_videos_db", JSON.stringify(list));
  }

  // Firestore
  try {
    if (db) {
      await setDoc(doc(db, "videos", video.id), video, { merge: true });
    }
  } catch (e) {
    console.error("Error saving video to Firestore:", e);
    throw e;
  }
}

export async function deleteDynamicVideo(id: string): Promise<void> {
  // LocalStorage Mock
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("amoi_mock_videos_db");
    if (local) {
      try {
        const list = JSON.parse(local) as ChurchVideo[];
        const updated = list.filter((v) => v.id !== id);
        localStorage.setItem("amoi_mock_videos_db", JSON.stringify(updated));
      } catch {}
    }
  }

  // Firestore
  try {
    if (db) {
      await deleteDoc(doc(db, "videos", id));
    }
  } catch (e) {
    console.error("Error deleting video from Firestore:", e);
    throw e;
  }
}

export function getShortEmbedUrl(url: string): { embedUrl: string; platform: "youtube" | "tiktok" | "instagram" } | null {
  if (!url) return null;
  const urlTrimmed = url.trim();
  const urlLower = urlTrimmed.toLowerCase();

  if (urlLower.includes("youtube.com/shorts/") || urlLower.includes("youtu.be/")) {
    let videoId = "";
    if (urlTrimmed.includes("/shorts/")) {
      videoId = urlTrimmed.split("/shorts/")[1].split("?")[0].split("/")[0];
    } else if (urlLower.includes("youtu.be/")) {
      videoId = urlTrimmed.split("youtu.be/")[1].split("?")[0].split("/")[0];
    }
    if (videoId) {
      return {
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        platform: "youtube"
      };
    }
  }

  if (urlLower.includes("tiktok.com/")) {
    let videoId = "";
    if (urlTrimmed.includes("/video/")) {
      videoId = urlTrimmed.split("/video/")[1].split("?")[0].split("/")[0];
    }
    if (videoId) {
      return {
        embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
        platform: "tiktok"
      };
    }
    return {
      embedUrl: urlTrimmed,
      platform: "tiktok"
    };
  }

  if (urlLower.includes("instagram.com/reel/") || urlLower.includes("instagram.com/reels/")) {
    let reelId = "";
    if (urlTrimmed.includes("/reel/")) {
      reelId = urlTrimmed.split("/reel/")[1].split("?")[0].split("/")[0];
    } else if (urlTrimmed.includes("/reels/")) {
      reelId = urlTrimmed.split("/reels/")[1].split("?")[0].split("/")[0];
    }
    if (reelId) {
      return {
        embedUrl: `https://www.instagram.com/reel/${reelId}/embed/`,
        platform: "instagram"
      };
    }
  }

  return null;
}

// ============ SERVANTS (O CHAMADO) MANAGEMENT ============

export interface ChurchServant {
  id: string;
  name: string;
  role: string;
  dept: string;
  bio: string;
  img?: string;
  order?: number;
}

export const DEFAULT_SERVANTS: ChurchServant[] = [
  // Os Bravos Guerreiros da Fé (Liderança Geral)
  { id: "s12", name: "Serva Elizabeth CastelBranco", role: "Líder & Visionária da AMOI", img: "serva-elizabeth", dept: "Os Bravos Guerreiros da Fé", bio: "Esposa do Pastor Nicolau CastelBranco, é a líder e visionária fundadora da AMOI, guiando o ministério com sabedoria, oração e direção divina.", order: 1 },
  { id: "s13", name: "Profeta Edgar Marcolino", role: "Profeta", img: "profeta-edgar", dept: "Os Bravos Guerreiros da Fé", bio: "Ministério profético da AMOI, atuando no despertamento espiritual e na revelação da palavra de Deus.", order: 2 },
  { id: "s14", name: "Anciã Maria Júlia Marcolino", role: "Anciã", img: "ancia-maria-julia", dept: "Os Bravos Guerreiros da Fé", bio: "Esposa do Profeta Edgar Marcolino, atua como anciã com dedicação, oração e aconselhamento.", order: 3 },
  { id: "s4", name: "Pastor Nelson Nunes", role: "Pastor", img: "pastor-nelson", dept: "Os Bravos Guerreiros da Fé", bio: "Pastor dedicado ao ministério na AMOI, focado no ensino da Palavra e no cuidado espiritual da igreja.", order: 4 },
  { id: "s8", name: "Anciã Isabel Nunes", role: "Anciã", img: "ancia-isabel", dept: "Os Bravos Guerreiros da Fé", bio: "Esposa do Pastor Nelson Nunes, é uma anciã dedicada à intercessão, apoio espiritual e fortalecimento familiar.", order: 5 },
  { id: "s6", name: "Anciã Rosalina Canjila", role: "Anciã", img: "ancia-rosalina", dept: "Os Bravos Guerreiros da Fé", bio: "Consagrada anciã da AMOI, atua com dedicação e coração disponível para Deus nas reuniões de aconselhamento e oração.", order: 6 },
  { id: "s5", name: "Diaconisa Judith Fernandes", role: "Diaconisa", img: "diaconisa-judith", dept: "Os Bravos Guerreiros da Fé", bio: "Diaconisa da AMOI, dedicada ao serviço da casa do Senhor com alegria, zelo e apoio constante.", order: 7 },

  // Departamentos
  { id: "s1", name: "Anciã Sandra Congo", role: "Coordenadora do Ministério Infantil", dept: "Departamento das Crianças", bio: "Guia as crianças nos primeiros passos da fé com amor, ensino bíblico e paciência.", order: 8 },
  { id: "s2", name: "Pastor Tiago Congo", role: "Coordenador Geral dos Jovens", dept: "Departamento dos Jovens", bio: "Lidera a juventude com dinamismo, focando no despertamento espiritual e santidade.", order: 9 },
  { id: "s3", name: "Pastor Nicolau CastelBranco", role: "Conselheiro Administrativo", img: "pastor-nicolau", dept: "Departamento Administrativo", bio: "Apoia o comitê da igreja no planeamento estratégico e estabilidade institucional.", order: 10 },
  { id: "s5_dept", name: "Diaconisa Judith Fernandes", role: "Secretária Geral", img: "diaconisa-judith", dept: "Secretaria", bio: "Garante a organização administrativa e a comunicação oficial com os membros.", order: 11 },
  { id: "s6_dept", name: "Anciã Rosalina Canjila", role: "Coordenadora de Ação Social", img: "ancia-rosalina", dept: "Ação Social", bio: "Lidera os projetos de apoio às famílias carenciadas e visitas de amparo.", order: 12 },
  { id: "s7", name: "Diaconisa Judith Fernandes", role: "Apoio a Ação Social", img: "diaconisa-judith", dept: "Ação Social", bio: "Garante o controle e a distribuição das doações entregues à igreja.", order: 13 },
  { id: "s9", name: "Anciã Sandra Congo", role: "Apoio ao Ministério de Mulheres", dept: "Departamento das Mulheres", bio: "Trabalha no fortalecimento espiritual e no apoio mútuo entre as irmãs.", order: 14 },
  { id: "s10", name: "Pastor Nelson Nunes", role: "Conselheiro dos Varões", img: "pastor-nelson", dept: "Departamento dos Homens", bio: "Ministra a Palavra aos homens, focando no papel do homem segundo o coração de Deus.", order: 15 },
  { id: "s11", name: "Pastor Tiago Congo", role: "Líder dos Varões", dept: "Departamento dos Homens", bio: "Organiza as vigílias e encontros de edificação masculina na igreja.", order: 16 }
];

export async function getDynamicServants(): Promise<ChurchServant[]> {
  try {
    if (db) {
      const snap = await getDocs(collection(db, "servants"));
      const list: ChurchServant[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ChurchServant);
      });
      
      // Sort list by order
      list.sort((a, b) => {
        const orderA = a.order !== undefined ? a.order : 999;
        const orderB = b.order !== undefined ? b.order : 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });

      if (list.length > 0) {
        if (typeof window !== "undefined") {
          localStorage.setItem("amoi_servants", JSON.stringify(list));
        }
        return list;
      }
    }
  } catch (e) {
    console.error("Error loading servants from Firestore:", e);
  }

  // LocalStorage Fallback
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("amoi_servants");
    if (local) {
      try {
        const list = JSON.parse(local) as ChurchServant[];
        list.sort((a, b) => {
          const orderA = a.order !== undefined ? a.order : 999;
          const orderB = b.order !== undefined ? b.order : 999;
          if (orderA !== orderB) return orderA - orderB;
          return a.name.localeCompare(b.name);
        });
        return list;
      } catch {}
    }
  }
  return DEFAULT_SERVANTS;
}

export async function saveDynamicServant(servant: ChurchServant): Promise<void> {
  // LocalStorage
  if (typeof window !== "undefined") {
    const list = await getDynamicServants();
    const idx = list.findIndex(s => s.id === servant.id);
    if (idx >= 0) {
      list[idx] = servant;
    } else {
      list.push(servant);
    }
    localStorage.setItem("amoi_servants", JSON.stringify(list));
  }

  // Firestore
  try {
    if (db) {
      await setDoc(doc(db, "servants", servant.id), servant, { merge: true });
    }
  } catch (e) {
    console.error("Error saving servant to Firestore:", e);
    throw e;
  }
}

export async function deleteDynamicServant(id: string): Promise<void> {
  // LocalStorage
  if (typeof window !== "undefined") {
    const list = await getDynamicServants();
    const updated = list.filter(s => s.id !== id);
    localStorage.setItem("amoi_servants", JSON.stringify(updated));
  }

  // Firestore
  try {
    if (db) {
      await deleteDoc(doc(db, "servants", id));
    }
  } catch (e) {
    console.error("Error deleting servant from Firestore:", e);
    throw e;
  }
}





