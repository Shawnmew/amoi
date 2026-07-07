import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth, UserRole } from "../hooks/useAuth";
import { firebaseConfig, auth } from "../lib/firebase";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import {
  CarouselSlide,
  Announcement,
  ChurchInfo,
  ChurchUser,
  getDynamicSlides,
  saveDynamicSlides,
  getDynamicAnnouncements,
  saveDynamicAnnouncement,
  deleteDynamicAnnouncement,
  getDynamicInfo,
  saveDynamicInfo,
  getDynamicUsers,
  saveDynamicUser,
  deleteDynamicUser,
  convertGoogleDriveLink,
  queueNewsletterEmail,
  WhatsAppSettings,
  getWhatsAppSettings,
  saveWhatsAppSettings,
  ChurchVideo,
  getDynamicVideos,
  saveDynamicVideo,
  deleteDynamicVideo,
  ChurchServant,
  getDynamicServants,
  saveDynamicServant,
  deleteDynamicServant
} from "../lib/dynamicContent";
import {
  LayoutDashboard,
  Image as ImageIcon,
  FileText,
  Settings,
  Plus,
  Trash2,
  Save,
  ArrowUp,
  ArrowDown,
  Lock,
  Calendar,
  User,
  PlusCircle,
  Users,
  Mail,
  CheckCircle,
  XCircle,
  Phone,
  Pencil,
  X,
  MessageSquare,
  Send,
  Loader2,
  Video,
  Film,
  Youtube,
  Smartphone
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel de Administração — AMOI" },
      { name: "description", content: "Painel de gestão dinâmica de conteúdos da AMOI." },
    ],
  }),
  component: AdminDashboard,
});

type TabType = "carousel" | "announcements" | "info" | "users" | "whatsapp" | "videos" | "servants";

const SERVANT_DEPARTMENTS = [
  "Os Bravos Guerreiros da Fé",
  "Departamento das Crianças",
  "Departamento dos Jovens",
  "Departamento Administrativo",
  "Secretaria",
  "Ação Social",
  "Departamento das Mulheres",
  "Departamento dos Homens"
];

function AdminDashboard() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("carousel");
  
  // Data States
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [info, setInfo] = useState<ChurchInfo | null>(null);
  const [usersList, setUsersList] = useState<ChurchUser[]>([]);
  const [videos, setVideos] = useState<ChurchVideo[]>([]);
  const [servantsList, setServantsList] = useState<ChurchServant[]>([]);

  // Servant Form State
  const [servantName, setServantName] = useState("");
  const [servantRole, setServantRole] = useState("");
  const [servantDept, setServantDept] = useState("Departamento Administrativo");
  const [servantBio, setServantBio] = useState("");
  const [servantImg, setServantImg] = useState("");
  const [editingServantId, setEditingServantId] = useState<string | null>(null);
  const [savingServant, setSavingServant] = useState(false);

  // Video Form State
  const [videoTitle, setVideoTitle] = useState("");
  const [videoSpeaker, setVideoSpeaker] = useState("");
  const [videoDate, setVideoDate] = useState(new Date().toISOString().split("T")[0]);
  const [videoCategory, setVideoCategory] = useState<ChurchVideo["category"]>("Pregação");
  const [videoType, setVideoType] = useState<ChurchVideo["type"]>("youtube");
  const [videoYoutubeId, setVideoYoutubeId] = useState("");
  const [videoShortUrl, setVideoShortUrl] = useState("");
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [savingVideo, setSavingVideo] = useState(false);

  // Carousel form state
  const [newSlideSrc, setNewSlideSrc] = useState("");
  const [newSlideTitle, setNewSlideTitle] = useState("");
  const [newSlideSubtitle, setNewSlideSubtitle] = useState("");
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);

  // Announcement form state
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnCategory, setNewAnnCategory] = useState("Notícia");
  const [newAnnAuthor, setNewAnnAuthor] = useState("");
  const [newAnnContent, setNewAnnContent] = useState("");
  const [newAnnImage, setNewAnnImage] = useState("");
  const [annImageType, setAnnImageType] = useState<"url" | "upload">("upload");

  // User creation form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("membro");
  const [newUserNewsletter, setNewUserNewsletter] = useState(true);
  const [creatingUser, setCreatingUser] = useState(false);

  // User editing state
  const [editingUser, setEditingUser] = useState<ChurchUser | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserPhone, setEditUserPhone] = useState("");
  const [editUserRole, setEditUserRole] = useState<UserRole>("membro");
  const [editUserNewsletter, setEditUserNewsletter] = useState(true);

  // WhatsApp automation state
  const [waSettings, setWaSettings] = useState<WhatsAppSettings>({ gatewayType: "link" });
  const [waTemplate, setWaTemplate] = useState("Olá {nome}! Lembramos que hoje teremos o nosso Culto na AMOI. Esperamos por si! Deus abençoe.");
  const [waStatus, setWaStatus] = useState<Record<string, "pending" | "sending" | "success" | "error">>( {});
  const [waSending, setWaSending] = useState(false);
  const [waSelectedUsers, setWaSelectedUsers] = useState<Record<string, boolean>>({});

  const handleAnnImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAnnImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Load Data
  useEffect(() => {
    if (user && user.role?.toLowerCase() !== "membro") {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    try {
      const fetchedSlides = await getDynamicSlides();
      const fetchedAnns = await getDynamicAnnouncements();
      const fetchedInfo = await getDynamicInfo();
      const fetchedVideos = await getDynamicVideos();
      const fetchedServants = await getDynamicServants();
      
      setSlides(fetchedSlides);
      setAnnouncements(fetchedAnns);
      setInfo(fetchedInfo);
      setVideos(fetchedVideos);
      setServantsList(fetchedServants);

      // Apenas Servos de Deus podem ver utilizadores
      if (user?.role === "Servo de Deus") {
        const fetchedUsers = await getDynamicUsers();
        setUsersList(fetchedUsers);
        
        // Inicializar seleção do WhatsApp
        const selectedMap: Record<string, boolean> = {};
        fetchedUsers.forEach(u => {
          if (u.phone) {
            selectedMap[u.uid] = true;
          }
        });
        setWaSelectedUsers(selectedMap);
      }

      // Carregar configurações de WhatsApp
      const fetchedWaSettings = await getWhatsAppSettings();
      setWaSettings(fetchedWaSettings);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar os dados.");
    }
  };

  // Carousel actions
  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlideSrc || !newSlideTitle) {
      toast.warning("A imagem e o título são obrigatórios.");
      return;
    }

    let updated: CarouselSlide[];

    if (editingSlideId) {
      // Editar slide existente
      updated = slides.map(s => {
        if (s.id === editingSlideId) {
          return {
            ...s,
            src: convertGoogleDriveLink(newSlideSrc),
            title: newSlideTitle,
            subtitle: newSlideSubtitle
          };
        }
        return s;
      });
      toast.success("Slide atualizado com sucesso!");
      setEditingSlideId(null);
    } else {
      // Adicionar novo slide
      const newSlide: CarouselSlide = {
        id: "slide-" + Date.now(),
        src: convertGoogleDriveLink(newSlideSrc),
        title: newSlideTitle,
        subtitle: newSlideSubtitle,
        order: slides.length + 1
      };
      updated = [...slides, newSlide];
      toast.success("Slide adicionado com sucesso!");
    }

    setSlides(updated);
    await saveDynamicSlides(updated);
    
    // reset form
    setNewSlideSrc("");
    setNewSlideTitle("");
    setNewSlideSubtitle("");
  };

  const handleStartEditSlide = (slide: CarouselSlide) => {
    setEditingSlideId(slide.id);
    setNewSlideTitle(slide.title);
    setNewSlideSubtitle(slide.subtitle || "");
    setNewSlideSrc(slide.src);
    // Rolar suavemente para o formulário de edição
    const formElement = document.getElementById("slide-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCancelEditSlide = () => {
    setEditingSlideId(null);
    setNewSlideSrc("");
    setNewSlideTitle("");
    setNewSlideSubtitle("");
  };

  const handleDeleteSlide = async (id: string) => {
    const updated = slides.filter(s => s.id !== id).map((s, idx) => ({ ...s, order: idx + 1 }));
    setSlides(updated);
    await saveDynamicSlides(updated);
    toast.success("Slide removido.");
  };

  const moveSlide = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === slides.length - 1) return;
    
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const updated = [...slides];
    
    // Swap
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    // Recalculate order
    const ordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSlides(ordered);
    await saveDynamicSlides(ordered);
    toast.info("Ordem alterada.");
  };

  // Announcement actions
  const handleAddAnn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle || !newAnnContent) {
      toast.warning("Título e conteúdo são obrigatórios.");
      return;
    }
    const newAnn: Announcement = {
      id: "ann-" + Date.now(),
      title: newAnnTitle,
      category: newAnnCategory,
      content: newAnnContent,
      date: new Date().toISOString().split("T")[0],
      author: newAnnAuthor || user?.displayName || "Admin",
      imageUrl: convertGoogleDriveLink(newAnnImage) || ""
    };

    try {
      await saveDynamicAnnouncement(newAnn);
      setAnnouncements([newAnn, ...announcements]);

      // Buscar utilizadores subscritos à newsletter
      const allUsers = await getDynamicUsers();
      const subscribers = allUsers
        .filter(u => u.newsletter && u.email)
        .map(u => u.email);

      let emailsSent = false;
      let isMock = false;

      if (subscribers.length > 0) {
        const result = await queueNewsletterEmail(
          newAnn.title,
          newAnn.category,
          newAnn.content,
          newAnn.author,
          newAnn.imageUrl,
          subscribers
        );
        emailsSent = result.success;
        isMock = !!result.mock;
      }

      if (emailsSent) {
        if (isMock) {
          toast.info(`Publicação criada! [Modo Demo] ${subscribers.length} notificações simuladas na consola.`);
        } else {
          toast.success(`Publicação criada e ${subscribers.length} notificações de e-mail agendadas no Firebase!`);
        }
      } else {
        toast.success(`Publicação "${newAnn.title}" criada com sucesso!`);
      }
    } catch (err) {
      console.error("Erro ao guardar publicação/notificação:", err);
      toast.error("Erro ao guardar a publicação. Tente novamente.");
    }

    // reset
    setNewAnnTitle("");
    setNewAnnContent("");
    setNewAnnAuthor("");
    setNewAnnImage("");
  };

  const handleDeleteAnn = async (id: string) => {
    await deleteDynamicAnnouncement(id);
    setAnnouncements(announcements.filter(a => a.id !== id));
    toast.success("Publicação removida.");
  };

  // Info actions
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!info) return;
    await saveDynamicInfo(info);
    toast.success("Informações atualizadas com sucesso!");
  };

  const handleScheduleChange = (index: number, field: "day" | "time", val: string) => {
    if (!info) return;
    const updatedSchedule = [...info.schedule];
    updatedSchedule[index] = { ...updatedSchedule[index], [field]: val };
    setInfo({ ...info, schedule: updatedSchedule });
  };

  // User tab actions
  const handleRoleChange = async (targetUser: ChurchUser, newRole: UserRole) => {
    const updated = { ...targetUser, role: newRole };
    await saveDynamicUser(updated);
    setUsersList(usersList.map(u => u.uid === targetUser.uid ? updated : u));
    toast.success(`Função de ${targetUser.displayName} atualizada para ${newRole}!`);
  };

  const handleNewsletterToggle = async (targetUser: ChurchUser) => {
    const updated = { ...targetUser, newsletter: !targetUser.newsletter };
    await saveDynamicUser(updated);
    setUsersList(usersList.map(u => u.uid === targetUser.uid ? updated : u));
    toast.success(`Newsletter de ${targetUser.displayName} ${updated.newsletter ? "ativada" : "desativada"}.`);
  };

  const handleDeleteUser = async (targetUser: ChurchUser) => {
    if (targetUser.email === user?.email) {
      toast.error("Não pode excluir a si mesmo!");
      return;
    }
    if (confirm(`Tem a certeza que deseja remover o membro ${targetUser.displayName}?`)) {
      await deleteDynamicUser(targetUser.uid, targetUser.email);
      setUsersList(usersList.filter(u => u.uid !== targetUser.uid));
      toast.success("Membro removido da base de dados.");
    }
  };

  const handleStartEditUser = (usr: ChurchUser) => {
    setEditingUser(usr);
    setEditUserName(usr.displayName);
    setEditUserPhone(usr.phone || "");
    setEditUserRole(usr.role);
    setEditUserNewsletter(usr.newsletter);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editUserName.trim()) {
      toast.warning("O nome é obrigatório.");
      return;
    }

    const updated: ChurchUser = {
      ...editingUser,
      displayName: editUserName.trim(),
      phone: editUserPhone.trim(),
      role: editUserRole,
      newsletter: editUserNewsletter
    };

    try {
      await saveDynamicUser(updated);
      setUsersList(usersList.map(u => u.uid === editingUser.uid ? updated : u));
      toast.success("Utilizador atualizado com sucesso!");
      setEditingUser(null);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar o utilizador.");
    }
  };

  // Video CRUD Handlers
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim() || !videoSpeaker.trim() || !videoDate) {
      toast.warning("Título, pregador/orador e data são obrigatórios.");
      return;
    }

    if (videoType === "youtube" && !videoYoutubeId.trim()) {
      toast.warning("O ID do vídeo no YouTube é obrigatório para vídeos longos.");
      return;
    }

    if (videoType === "short" && !videoShortUrl.trim()) {
      toast.warning("O URL do vídeo curto (Short, TikTok ou Reel) é obrigatório.");
      return;
    }

    setSavingVideo(true);
    try {
      let cleanYoutubeId = "";
      if (videoType === "youtube") {
        const trimmedId = videoYoutubeId.trim();
        if (trimmedId.includes("youtube.com/watch")) {
          const urlParams = new URLSearchParams(trimmedId.split("?")[1] || "");
          cleanYoutubeId = urlParams.get("v") || "";
        } else if (trimmedId.includes("youtu.be/")) {
          cleanYoutubeId = trimmedId.split("youtu.be/")[1]?.split("?")[0]?.split("/")[0] || "";
        } else if (trimmedId.includes("youtube.com/embed/")) {
          cleanYoutubeId = trimmedId.split("youtube.com/embed/")[1]?.split("?")[0]?.split("/")[0] || "";
        } else {
          cleanYoutubeId = trimmedId.split("?")[0].split("&")[0].split("/")[0];
        }

        if (!cleanYoutubeId) {
          toast.warning("ID do YouTube inválido ou não detetado.");
          setSavingVideo(false);
          return;
        }
      }

      const videoData: ChurchVideo = {
        id: editingVideoId || `video-${Date.now()}`,
        title: videoTitle.trim(),
        speaker: videoSpeaker.trim(),
        date: videoDate,
        category: videoCategory,
        type: videoType,
        youtubeId: videoType === "youtube" ? cleanYoutubeId : "",
        shortUrl: videoType === "short" ? videoShortUrl.trim() : ""
      };

      await saveDynamicVideo(videoData);
      toast.success(editingVideoId ? "Vídeo atualizado com sucesso!" : "Vídeo adicionado com sucesso!");
      
      // Reset form
      setVideoTitle("");
      setVideoSpeaker("");
      setVideoDate(new Date().toISOString().split("T")[0]);
      setVideoCategory("Pregação");
      setVideoType("youtube");
      setVideoYoutubeId("");
      setVideoShortUrl("");
      setEditingVideoId(null);
      
      const fetched = await getDynamicVideos();
      setVideos(fetched);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao guardar o vídeo.");
    } finally {
      setSavingVideo(false);
    }
  };

  const handleStartEditVideo = (video: ChurchVideo) => {
    setEditingVideoId(video.id);
    setVideoTitle(video.title);
    setVideoSpeaker(video.speaker);
    setVideoDate(video.date);
    setVideoCategory(video.category);
    setVideoType(video.type);
    setVideoYoutubeId(video.youtubeId || "");
    setVideoShortUrl(video.shortUrl || "");
    
    const formEl = document.getElementById("video-form-section");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!window.confirm("Tem a certeza que deseja eliminar este vídeo?")) return;
    try {
      await deleteDynamicVideo(id);
      toast.success("Vídeo eliminado com sucesso!");
      const fetched = await getDynamicVideos();
      setVideos(fetched);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao eliminar o vídeo.");
    }
  };

  // Servant CRUD Handlers
  const handleSaveServant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servantName.trim() || !servantRole.trim() || !servantBio.trim()) {
      toast.warning("Nome, cargo e biografia são obrigatórios.");
      return;
    }

    setSavingServant(true);
    try {
      const servantData: ChurchServant = {
        id: editingServantId || `servant-${Date.now()}`,
        name: servantName.trim(),
        role: servantRole.trim(),
        dept: servantDept,
        bio: servantBio.trim(),
        img: servantImg.trim() || undefined
      };

      await saveDynamicServant(servantData);
      toast.success(editingServantId ? "Servo atualizado com sucesso!" : "Servo adicionado com sucesso!");

      // Reset form
      setServantName("");
      setServantRole("");
      setServantDept("Departamento Administrativo");
      setServantBio("");
      setServantImg("");
      setEditingServantId(null);

      const fetched = await getDynamicServants();
      setServantsList(fetched);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao guardar o servo.");
    } finally {
      setSavingServant(false);
    }
  };

  const handleStartEditServant = (servant: ChurchServant) => {
    setEditingServantId(servant.id);
    setServantName(servant.name);
    setServantRole(servant.role);
    setServantDept(servant.dept);
    setServantBio(servant.bio);
    setServantImg(servant.img || "");

    const formEl = document.getElementById("servant-form-section");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDeleteServant = async (id: string) => {
    if (!window.confirm("Tem a certeza que deseja eliminar este servo?")) return;
    try {
      await deleteDynamicServant(id);
      toast.success("Servo eliminado com sucesso!");
      const fetched = await getDynamicServants();
      setServantsList(fetched);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao eliminar o servo.");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword || !newUserName) {
      toast.warning("Nome, E-mail e Palavra-passe são obrigatórios.");
      return;
    }
    if (newUserPassword.length < 6) {
      toast.warning("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }

    setCreatingUser(true);
    const emailClean = newUserEmail.trim().toLowerCase();

    try {
      const isFirebaseActive = !!auth;

      if (isFirebaseActive) {
        // 1. Firebase Mode: Create user securely via temporary Firebase Auth app instance.
        // This avoids logging out the currently authenticated admin.
        const tempApp = initializeApp(firebaseConfig, "TempAdminCreateUserApp-" + Date.now());
        const tempAuth = getAuth(tempApp);

        try {
          const userCredential = await createUserWithEmailAndPassword(
            tempAuth,
            emailClean,
            newUserPassword
          );
          
          const newUid = userCredential.user.uid;
          const newChurchUser: ChurchUser = {
            uid: newUid,
            email: emailClean,
            displayName: newUserName.trim(),
            role: newUserRole,
            newsletter: newUserNewsletter,
            phone: newUserPhone.trim() || undefined
          };

          // Save profile in Firestore
          await saveDynamicUser(newChurchUser);
          
          // Add to current usersList view
          setUsersList(prev => [...prev, newChurchUser]);
          toast.success(`Utilizador ${newChurchUser.displayName} criado com sucesso no Firebase!`);

          // Reset Form
          setNewUserEmail("");
          setNewUserPassword("");
          setNewUserName("");
          setNewUserPhone("");
          setNewUserRole("membro");
          setNewUserNewsletter(true);
        } catch (authErr: any) {
          console.error("Auth creation error:", authErr);
          if (authErr.code === "auth/email-already-in-use") {
            toast.error("Este endereço de e-mail já está associado a outra conta.");
          } else {
            toast.error(authErr.message || "Erro ao criar utilizador no Firebase Auth.");
          }
        } finally {
          // Cleanup secondary app instance from memory
          await tempApp.delete();
        }
      } else {
        // 2. Mock Mode: Add user to local storage mock database
        const mockDbStr = localStorage.getItem("amoi_mock_users_db");
        let list: any[] = [];
        if (mockDbStr) {
          try {
            list = JSON.parse(mockDbStr);
          } catch {}
        }

        const emailExists = list.some(u => u.email.toLowerCase() === emailClean);
        if (emailExists) {
          toast.error("Este endereço de e-mail já está associado a outra conta.");
          setCreatingUser(false);
          return;
        }

        const newUid = "mock-uid-" + Date.now();
        const newMockUser = {
          uid: newUid,
          email: emailClean,
          password: newUserPassword,
          name: newUserName.trim(),
          role: newUserRole,
          newsletter: newUserNewsletter,
          phone: newUserPhone.trim() || ""
        };

        list.push(newMockUser);
        localStorage.setItem("amoi_mock_users_db", JSON.stringify(list));

        // Add to current usersList view
        const newChurchUser: ChurchUser = {
          uid: newUid,
          email: emailClean,
          displayName: newMockUser.name,
          role: newUserRole,
          newsletter: newUserNewsletter,
          phone: newUserPhone.trim() || undefined
        };
        setUsersList(prev => [...prev, newChurchUser]);
        
        toast.success(`[Modo Demo] Utilizador ${newChurchUser.displayName} criado com sucesso!`);

        // Reset Form
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserName("");
        setNewUserPhone("");
        setNewUserRole("membro");
        setNewUserNewsletter(true);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao criar o utilizador.");
    } finally {
      setCreatingUser(false);
    }
  };

  // WhatsApp Notification Actions
  const replacePlaceholders = (template: string, usr: ChurchUser) => {
    return template
      .replace(/{nome}/g, usr.displayName || "")
      .replace(/{email}/g, usr.email || "")
      .replace(/{telefone}/g, usr.phone || "");
  };

  const handleSaveWaSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveWhatsAppSettings(waSettings);
      toast.success("Configurações do WhatsApp guardadas com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao guardar as configurações.");
    }
  };

  const formatPhoneNumber = (phone: string) => {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 9) {
      cleaned = "244" + cleaned; // default to Angola country code
    }
    return cleaned;
  };

  const sendSingleMessage = async (usr: ChurchUser): Promise<boolean> => {
    if (!usr.phone) return false;
    
    const text = replacePlaceholders(waTemplate, usr);
    const phone = formatPhoneNumber(usr.phone);

    setWaStatus(prev => ({ ...prev, [usr.uid]: "sending" }));

    if (waSettings.gatewayType === "link") {
      const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
      setWaStatus(prev => ({ ...prev, [usr.uid]: "success" }));
      return true;
    }

    if (waSettings.gatewayType === "zapi") {
      try {
        const response = await fetch(`${waSettings.zapiUrl}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Client-Token": waSettings.zapiToken || ""
          },
          body: JSON.stringify({
            phone: phone,
            message: text
          })
        });
        if (response.ok) {
          setWaStatus(prev => ({ ...prev, [usr.uid]: "success" }));
          return true;
        } else {
          throw new Error("HTTP " + response.status);
        }
      } catch (err) {
        console.error("Z-API Error for " + usr.displayName, err);
        setWaStatus(prev => ({ ...prev, [usr.uid]: "error" }));
        return false;
      }
    }

    if (waSettings.gatewayType === "twilio") {
      try {
        const formData = new URLSearchParams();
        formData.append("To", `whatsapp:+${phone}`);
        formData.append("From", `whatsapp:${waSettings.twilioFrom}`);
        formData.append("Body", text);

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${waSettings.twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Authorization": "Basic " + btoa(`${waSettings.twilioSid}:${waSettings.twilioToken}`),
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData
          }
        );
        if (response.ok) {
          setWaStatus(prev => ({ ...prev, [usr.uid]: "success" }));
          return true;
        } else {
          throw new Error("HTTP " + response.status);
        }
      } catch (err) {
        console.error("Twilio Error for " + usr.displayName, err);
        setWaStatus(prev => ({ ...prev, [usr.uid]: "error" }));
        return false;
      }
    }

    return false;
  };

  const handleBulkSendWa = async () => {
    const selectedUsersList = usersList.filter(u => u.phone && waSelectedUsers[u.uid]);
    if (selectedUsersList.length === 0) {
      toast.warning("Nenhum destinatário selecionado com telemóvel registado.");
      return;
    }

    setWaSending(true);
    toast.info(`A iniciar envio em massa para ${selectedUsersList.length} membros...`);

    if (waSettings.gatewayType === "link") {
      // Step-by-step confirmation for manual link generation to avoid pop-up blocking.
      for (let i = 0; i < selectedUsersList.length; i++) {
        const u = selectedUsersList[i];
        const confirmSend = confirm(
          `[WhatsApp Manual] Enviar para ${u.displayName} (${u.phone})?\n\nClique OK para abrir a janela do WhatsApp.`
        );
        if (confirmSend) {
          await sendSingleMessage(u);
        } else {
          setWaStatus(prev => ({ ...prev, [u.uid]: "pending" }));
        }
      }
      toast.success("Envio em massa concluído!");
      setWaSending(false);
      return;
    }

    // Fully automatic gateway dispatch loop.
    let successCount = 0;
    for (let i = 0; i < selectedUsersList.length; i++) {
      const u = selectedUsersList[i];
      const ok = await sendSingleMessage(u);
      if (ok) successCount++;
      await new Promise(resolve => setTimeout(resolve, 1500)); // rate limiting delay
    }

    toast.success(`Envio concluído! ${successCount} mensagens enviadas com sucesso.`);
    setWaSending(false);
  };

  // Security Render checking
  if (loading) {
    return (
      <SiteLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center">
          <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="mt-4 text-sm text-muted-foreground animate-pulse">A carregar painel admin...</p>
        </div>
      </SiteLayout>
    );
  }

  if (!user) {
    return (
      <SiteLayout>
        <section className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-4 py-16">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: "var(--gradient-radial-gold)" }} />
          <div className="relative max-w-md w-full text-center bg-card/60 backdrop-blur-xl border border-primary/20 rounded-3xl p-10 shadow-elevated">
            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary mb-6 border border-primary/30">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="font-display text-2xl font-bold text-gradient-gold">Acesso Restrito</h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Esta é a área administrativa da AMOI. Por favor, faça login com uma conta autorizada para gerir os conteúdos.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Button asChild className="bg-gradient-gold text-primary-foreground font-semibold shadow-gold">
                <Link to="/login">Fazer Login</Link>
              </Button>
              <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                <Link to="/">Voltar para o Início</Link>
              </Button>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  if (user.role?.toLowerCase() === "membro") {
    return (
      <SiteLayout>
        <section className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-4 py-16">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: "var(--gradient-radial-gold)" }} />
          <div className="relative max-w-md w-full text-center bg-card/60 backdrop-blur-xl border border-red-500/20 rounded-3xl p-10 shadow-elevated">
            <div className="h-16 w-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto text-red-500 mb-6 border border-red-500/30">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="font-display text-2xl font-bold text-red-500">Acesso Negado</h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Lamentamos, mas a sua conta (<strong className="text-primary">{user.displayName || user.email}</strong>) está registada como <strong className="text-primary">Membro</strong>. Apenas Editores e Servos de Deus têm acesso a esta área.
            </p>
            <div className="mt-8">
              <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                <Link to="/">Voltar para o Início</Link>
              </Button>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-border/60">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold flex items-center gap-1.5">
                <LayoutDashboard className="h-3.5 w-3.5" /> Administração AMOI
              </span>
              <h1 className="mt-2 text-3xl md:text-4xl font-bold">Gestão da Página</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Autenticado como: <strong className="text-primary">{user.displayName || user.email}</strong> · Função: <strong className="text-gradient-gold font-bold">{user.role}</strong>
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-card border border-primary/20 text-xs font-semibold text-primary/80 tracking-wide flex items-center gap-2 self-start md:self-auto">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Sincronização Ativa · {user.role === "Servo de Deus" ? "Nível Administrador" : "Nível Editor"}
            </div>
          </div>

          <div className="mt-10 grid lg:grid-cols-4 gap-8">
            
            {/* Sidebar Tabs */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab("carousel")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                  activeTab === "carousel"
                    ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold"
                    : "bg-card border-border/60 text-muted-foreground hover:text-primary hover:border-primary/30"
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                Slides do Carrossel
              </button>
              <button
                onClick={() => setActiveTab("announcements")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                  activeTab === "announcements"
                    ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold"
                    : "bg-card border-border/60 text-muted-foreground hover:text-primary hover:border-primary/30"
                }`}
              >
                <FileText className="h-4 w-4" />
                Mural & Publicações
              </button>
              <button
                onClick={() => setActiveTab("info")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                  activeTab === "info"
                    ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold"
                    : "bg-card border-border/60 text-muted-foreground hover:text-primary hover:border-primary/30"
                }`}
              >
                <Settings className="h-4 w-4" />
                Textos & Horários
              </button>

              <button
                onClick={() => setActiveTab("videos")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                  activeTab === "videos"
                    ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold"
                    : "bg-card border-border/60 text-muted-foreground hover:text-primary hover:border-primary/30"
                }`}
              >
                <Video className="h-4 w-4" />
                Cultos & Vídeos
              </button>

              <button
                onClick={() => setActiveTab("servants")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                  activeTab === "servants"
                    ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold"
                    : "bg-card border-border/60 text-muted-foreground hover:text-primary hover:border-primary/30"
                }`}
              >
                <Users className="h-4 w-4" />
                Equipa & Servos
              </button>

              {user.role === "Servo de Deus" && (
                <button
                  onClick={() => setActiveTab("users")}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                    activeTab === "users"
                      ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold"
                      : "bg-card border-border/60 text-muted-foreground hover:text-primary hover:border-primary/30"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Gerir Utilizadores
                </button>
              )}

              <button
                onClick={() => setActiveTab("whatsapp")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                  activeTab === "whatsapp"
                    ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold"
                    : "bg-card border-border/60 text-muted-foreground hover:text-primary hover:border-primary/30"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Disparos WhatsApp
              </button>
              
              <div className="mt-8 p-4 rounded-2xl bg-card/40 border border-primary/10 text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-primary block mb-1">Permissões de Acesso:</span>
                * <strong>Servo de Deus:</strong> Acesso total às configurações e controle de membros.<br/>
                * <strong>Editor:</strong> Apenas modificação do layout visual e publicações.
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">
              <div className="bg-card/50 backdrop-blur-xl border border-border/60 rounded-3xl p-6 md:p-8 shadow-elevated">
                
                {/* 1. CAROUSEL TAB */}
                {activeTab === "carousel" && (
                  <div>
                    <h2 className="text-2xl font-bold font-display text-primary flex items-center gap-2 mb-6">
                      <ImageIcon className="h-5 w-5" /> Slides do Carrossel Hero
                    </h2>
                    
                    {/* Add new slide form */}
                    <form id="slide-form" onSubmit={handleSaveSlide} className="bg-background/40 border border-primary/20 rounded-2xl p-5 mb-8 space-y-4">
                      <div className="font-semibold text-sm text-primary flex items-center gap-2 mb-2">
                        {editingSlideId ? (
                          <><Pencil className="h-4 w-4" /> Editar Slide</>
                        ) : (
                          <><PlusCircle className="h-4 w-4" /> Adicionar Novo Slide</>
                        )}
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="slide-title" className="text-xs uppercase tracking-wider text-muted-foreground">Título do Slide</Label>
                          <Input
                            id="slide-title"
                            placeholder="Ex: Adoração que Move o Céu"
                            required
                            value={newSlideTitle}
                            onChange={(e) => setNewSlideTitle(e.target.value)}
                            className="bg-card border-border/60"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="slide-subtitle" className="text-xs uppercase tracking-wider text-muted-foreground">Subtítulo</Label>
                          <Input
                            id="slide-subtitle"
                            placeholder="Ex: Cultos com a presença viva do Espírito Santo"
                            value={newSlideSubtitle}
                            onChange={(e) => setNewSlideSubtitle(e.target.value)}
                            className="bg-card border-border/60"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="slide-src" className="text-xs uppercase tracking-wider text-muted-foreground">URL da Imagem</Label>
                        <Input
                          id="slide-src"
                          placeholder="https://images.unsplash.com/... ou URL direta da imagem"
                          required
                          value={newSlideSrc}
                          onChange={(e) => setNewSlideSrc(e.target.value)}
                          className="bg-card border-border/60"
                        />
                      </div>

                      {newSlideSrc && (
                        <div className="space-y-2">
                          <span className="text-xs uppercase tracking-wider text-muted-foreground block">Pré-visualização da Imagem</span>
                          <div className="relative aspect-[21/9] rounded-xl overflow-hidden border border-border">
                            <img src={convertGoogleDriveLink(newSlideSrc)} alt="Preview" className="object-cover w-full h-full" onError={(e) => { (e.target as any).src = "https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?w=800"; }} />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button type="submit" className="bg-gradient-gold text-primary-foreground font-semibold shadow-gold">
                          {editingSlideId ? (
                            <><Save className="mr-2 h-4 w-4" /> Guardar Alterações</>
                          ) : (
                            <><Plus className="mr-2 h-4 w-4" /> Adicionar Slide</>
                          )}
                        </Button>
                        {editingSlideId && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelEditSlide}
                            className="border-border/60"
                          >
                            <X className="mr-2 h-4 w-4" /> Cancelar
                          </Button>
                        )}
                      </div>
                    </form>

                    {/* Slides List */}
                    <div className="space-y-4">
                      <div className="font-semibold text-sm text-muted-foreground">Slides Ativos ({slides.length})</div>
                      
                      {slides.length === 0 ? (
                        <p className="text-center text-muted-foreground py-6 text-sm">Sem slides definidos.</p>
                      ) : (
                        <div className="space-y-3">
                          {slides.map((slide, idx) => (
                            <div key={slide.id} className="flex items-center gap-4 p-4 rounded-2xl bg-background/30 border border-border/60 group hover:border-primary/30 transition-all">
                              <div className="relative h-14 w-24 rounded-lg overflow-hidden shrink-0 border border-border">
                                <img src={slide.src} alt={slide.title} className="w-full h-full object-cover" />
                                <span className="absolute bottom-1 right-1 bg-background/80 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  #{slide.order}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm truncate">{slide.title}</h4>
                                <p className="text-xs text-muted-foreground truncate">{slide.subtitle || "Sem subtítulo"}</p>
                              </div>
                              
                              {/* Order & Actions */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveSlide(idx, "up")}
                                  disabled={idx === 0}
                                  className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveSlide(idx, "down")}
                                  disabled={idx === slides.length - 1}
                                  className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditSlide(slide)}
                                  className="p-1.5 rounded-lg border border-primary/20 hover:bg-primary/10 text-primary"
                                  title="Editar slide"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSlide(slide.id)}
                                  className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-500"
                                  title="Remover slide"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. ANNOUNCEMENTS TAB */}
                {activeTab === "announcements" && (
                  <div>
                    <h2 className="text-2xl font-bold font-display text-primary flex items-center gap-2 mb-6">
                      <FileText className="h-5 w-5" /> Mural de Publicações & Eventos
                    </h2>

                    {/* New announcement form */}
                    <form onSubmit={handleAddAnn} className="bg-background/40 border border-primary/20 rounded-2xl p-5 mb-8 space-y-4">
                      <div className="font-semibold text-sm text-primary flex items-center gap-2 mb-2">
                        <PlusCircle className="h-4 w-4" /> Criar Nova Publicação
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-2">
                          <Label htmlFor="ann-title" className="text-xs uppercase tracking-wider text-muted-foreground">Título</Label>
                          <Input
                            id="ann-title"
                            placeholder="Ex: Campanha de Oração"
                            required
                            value={newAnnTitle}
                            onChange={(e) => setNewAnnTitle(e.target.value)}
                            className="bg-card border-border/60"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ann-cat" className="text-xs uppercase tracking-wider text-muted-foreground">Categoria</Label>
                          <select
                            id="ann-cat"
                            value={newAnnCategory}
                            onChange={(e) => setNewAnnCategory(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-border/60 bg-card text-sm focus:outline-none focus:border-primary"
                          >
                            <option value="Notícia">Notícia</option>
                            <option value="Evento">Evento</option>
                            <option value="Aviso">Aviso</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ann-author" className="text-xs uppercase tracking-wider text-muted-foreground">Autor (opcional)</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="ann-author"
                            placeholder={user?.displayName || "Seu nome"}
                            value={newAnnAuthor}
                            onChange={(e) => setNewAnnAuthor(e.target.value)}
                            className="pl-10 bg-card border-border/60"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ann-content" className="text-xs uppercase tracking-wider text-muted-foreground">Conteúdo / Descrição</Label>
                        <Textarea
                          id="ann-content"
                          placeholder="Escreva aqui as informações da notícia ou do evento..."
                          required
                          value={newAnnContent}
                          onChange={(e) => setNewAnnContent(e.target.value)}
                          className="bg-card border-border/60 min-h-[100px]"
                        />
                      </div>

                      {/* Image Attachment Section */}
                      <div className="space-y-3 p-4 rounded-xl border border-primary/10 bg-background/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Anexar Imagem (opcional)</Label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => { setAnnImageType("upload"); setNewAnnImage(""); }}
                              className={`text-[10px] px-2.5 py-1 rounded font-bold transition-colors ${
                                annImageType === "upload" ? "bg-primary/20 text-primary border border-primary/30" : "bg-card border border-border text-muted-foreground"
                              }`}
                            >
                              Carregar Ficheiro
                            </button>
                            <button
                              type="button"
                              onClick={() => { setAnnImageType("url"); setNewAnnImage(""); }}
                              className={`text-[10px] px-2.5 py-1 rounded font-bold transition-colors ${
                                annImageType === "url" ? "bg-primary/20 text-primary border border-primary/30" : "bg-card border border-border text-muted-foreground"
                              }`}
                            >
                              Inserir URL
                            </button>
                          </div>
                        </div>

                        {annImageType === "upload" ? (
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleAnnImageUpload}
                              className="bg-card border-border/60 text-xs py-1.5 cursor-pointer file:text-xs file:font-semibold"
                            />
                            <p className="text-[10px] text-muted-foreground">Suporta JPG, PNG, WEBP (será guardado como texto base64)</p>
                          </div>
                        ) : (
                          <Input
                            placeholder="https://exemplo.com/imagem.jpg"
                            value={newAnnImage}
                            onChange={(e) => setNewAnnImage(e.target.value)}
                            className="bg-card border-border/60 text-sm"
                          />
                        )}

                        {newAnnImage && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Pré-visualização do Anexo</span>
                            <div className="relative aspect-video max-w-xs rounded-xl overflow-hidden border border-border">
                              <img src={convertGoogleDriveLink(newAnnImage)} alt="Anexo Preview" className="object-cover w-full h-full" onError={(e) => { (e.target as any).src = "https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?w=800"; }} />
                              <button
                                type="button"
                                onClick={() => setNewAnnImage("")}
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 text-[10px] font-bold"
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button type="submit" className="bg-gradient-gold text-primary-foreground font-semibold shadow-gold">
                        <Save className="mr-2 h-4 w-4" /> Publicar no Mural
                      </Button>
                    </form>

                    {/* Announcement List */}
                    <div className="space-y-4">
                      <div className="font-semibold text-sm text-muted-foreground">Publicações Ativas ({announcements.length})</div>
                      
                      {announcements.length === 0 ? (
                        <p className="text-center text-muted-foreground py-6 text-sm">Sem publicações no mural.</p>
                      ) : (
                        <div className="space-y-3">
                          {announcements.map((ann) => (
                            <div key={ann.id} className="p-4 rounded-2xl bg-background/30 border border-border/60 flex justify-between gap-4 hover:border-primary/20 transition-colors">
                              <div className="flex gap-4 items-start min-w-0">
                                {ann.imageUrl && (
                                  <div className="h-16 w-24 rounded-lg overflow-hidden shrink-0 border border-border">
                                    <img src={ann.imageUrl} alt={ann.title} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold rounded-full bg-primary/20 text-primary border border-primary/25">
                                      {ann.category}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">{ann.date}</span>
                                  </div>
                                  <h4 className="font-bold text-base mt-1.5 truncate">{ann.title}</h4>
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ann.content}</p>
                                  <span className="text-[10px] text-muted-foreground mt-2 block">Por: {ann.author}</span>
                                </div>
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => handleDeleteAnn(ann.id)}
                                className="p-2 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-500 shrink-0 self-start"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. INFO TAB */}
                {activeTab === "info" && info && (
                  <div>
                    <h2 className="text-2xl font-bold font-display text-primary flex items-center gap-2 mb-6">
                      <Settings className="h-5 w-5" /> Textos e Horários de Culto
                    </h2>

                    <form onSubmit={handleSaveInfo} className="space-y-6">
                      <div className="space-y-4">
                        <div className="font-semibold text-sm text-muted-foreground pb-2 border-b border-border/30">Seção "Bem-vindo" (Página Inicial)</div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="welcome-title" className="text-xs uppercase tracking-wider text-muted-foreground">Título Principal</Label>
                          <Input
                            id="welcome-title"
                            value={info.welcomeTitle}
                            onChange={(e) => setInfo({ ...info, welcomeTitle: e.target.value })}
                            className="bg-card border-border/60"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="welcome-desc" className="text-xs uppercase tracking-wider text-muted-foreground">Descrição</Label>
                          <Textarea
                            id="welcome-desc"
                            value={info.welcomeDesc}
                            onChange={(e) => setInfo({ ...info, welcomeDesc: e.target.value })}
                            className="bg-card border-border/60 min-h-[100px]"
                          />
                        </div>
                      </div>

                      <div className="space-y-4 mt-6">
                        <div className="font-semibold text-sm text-muted-foreground pb-2 border-b border-border/30">Horários de Culto</div>
                        
                        {info.schedule.map((sch, sIdx) => (
                          <div key={sIdx} className="grid sm:grid-cols-3 gap-4 items-center">
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase text-muted-foreground">Dia da Semana</Label>
                              <Input
                                value={sch.day}
                                onChange={(e) => handleScheduleChange(sIdx, "day", e.target.value)}
                                className="bg-card border-border/60"
                              />
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                              <Label className="text-[10px] uppercase text-muted-foreground">Horário e Atividade</Label>
                              <Input
                                value={sch.time}
                                onChange={(e) => handleScheduleChange(sIdx, "time", e.target.value)}
                                className="bg-card border-border/60"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button type="submit" className="w-full sm:w-auto bg-gradient-gold text-primary-foreground font-semibold shadow-gold">
                        <Save className="mr-2 h-4 w-4" /> Guardar Alterações
                      </Button>
                    </form>
                  </div>
                )}

                {/* 4. USERS TAB (Apenas Servo de Deus) */}
                {activeTab === "users" && user.role === "Servo de Deus" && (
                  <div>
                    <h2 className="text-2xl font-bold font-display text-primary flex items-center gap-2 mb-6">
                      <Users className="h-5 w-5" /> Controlo de Membros & Níveis de Acesso
                    </h2>

                    {/* Criar Novo Utilizador Form */}
                    <form onSubmit={handleCreateUser} className="bg-background/40 border border-primary/20 rounded-2xl p-5 mb-8 space-y-4">
                      <div className="font-semibold text-sm text-primary flex items-center gap-2 mb-2">
                        <PlusCircle className="h-4 w-4" /> Registar Novo Membro / Utilizador
                      </div>
                      
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="user-name" className="text-xs uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                          <Input
                            id="user-name"
                            placeholder="Ex: Irmão Silva"
                            required
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            className="bg-card border-border/60"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="user-email" className="text-xs uppercase tracking-wider text-muted-foreground">Endereço de E-mail</Label>
                          <Input
                            id="user-email"
                            type="email"
                            placeholder="Ex: irmao.silva@amoi.org"
                            required
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            className="bg-card border-border/60"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="user-password" className="text-xs uppercase tracking-wider text-muted-foreground">Palavra-passe</Label>
                          <Input
                            id="user-password"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            required
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            className="bg-card border-border/60 text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 items-center">
                        <div className="space-y-2">
                          <Label htmlFor="user-phone" className="text-xs uppercase tracking-wider text-muted-foreground">Telemóvel (Opcional)</Label>
                          <Input
                            id="user-phone"
                            placeholder="Ex: 912345678"
                            value={newUserPhone}
                            onChange={(e) => setNewUserPhone(e.target.value)}
                            className="bg-card border-border/60"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="user-role" className="text-xs uppercase tracking-wider text-muted-foreground">Função / Nível de Acesso</Label>
                          <select
                            id="user-role"
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                            className="w-full h-10 px-3 rounded-lg border border-border/60 bg-card text-sm focus:outline-none focus:border-primary font-semibold text-primary"
                          >
                            <option value="membro">Membro</option>
                            <option value="Editor">Editor</option>
                            <option value="Servo de Deus">Servo de Deus (Admin)</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <input
                            id="user-newsletter"
                            type="checkbox"
                            checked={newUserNewsletter}
                            onChange={(e) => setNewUserNewsletter(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                          />
                          <Label htmlFor="user-newsletter" className="text-xs uppercase tracking-wider text-muted-foreground cursor-pointer select-none">
                            Subscrever Newsletter
                          </Label>
                        </div>
                      </div>

                      <Button type="submit" disabled={creatingUser} className="bg-gradient-gold text-primary-foreground font-semibold shadow-gold">
                        {creatingUser ? "A registar..." : "Registar Utilizador"}
                      </Button>
                    </form>

                    <div className="overflow-x-auto rounded-2xl border border-border/60">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-muted/40 border-b border-border/60">
                            <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Nome</th>
                            <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Email</th>
                            <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Telemóvel</th>
                            <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground text-center">Newsletter</th>
                            <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Função / Nível</th>
                            <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersList.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                Nenhum membro registrado na base de dados.
                              </td>
                            </tr>
                          ) : (
                            usersList.map((usr) => (
                              <tr key={usr.uid} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                                <td className="p-4 font-semibold text-foreground">
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs">
                                      {usr.displayName.charAt(0).toUpperCase()}
                                    </div>
                                    {usr.displayName}
                                  </div>
                                </td>
                                <td className="p-4 text-muted-foreground flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                                    {usr.email}
                                  </div>
                                </td>
                                <td className="p-4 text-muted-foreground">
                                  {usr.phone ? (
                                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-primary/60" /> {usr.phone}</span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground/45 italic">Sem telemóvel</span>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => handleNewsletterToggle(usr)}
                                    title="Alternar inscrição na newsletter"
                                    className="inline-flex focus:outline-none transition-transform hover:scale-105"
                                  >
                                    {usr.newsletter ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 text-[10px] font-bold">
                                        <CheckCircle className="h-3 w-3" /> Subscrito
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border text-[10px] font-bold">
                                        <XCircle className="h-3 w-3" /> Inativo
                                      </span>
                                    )}
                                  </button>
                                </td>
                                <td className="p-4">
                                  <select
                                    value={usr.role}
                                    onChange={(e) => handleRoleChange(usr, e.target.value as UserRole)}
                                    className="bg-card border border-border/60 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary font-semibold text-primary"
                                  >
                                    <option value="membro">Membro</option>
                                    <option value="Editor">Editor</option>
                                    <option value="Servo de Deus">Servo de Deus</option>
                                  </select>
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handleStartEditUser(usr)}
                                      className="p-2 text-primary border border-primary/20 hover:bg-primary/10 rounded-xl transition-colors"
                                      title="Editar Utilizador"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(usr)}
                                      disabled={usr.email === user.email}
                                      className="p-2 text-red-500 border border-red-500/20 hover:bg-red-500/10 rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                      title="Remover Utilizador"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Dialog to edit user details */}
                    <Dialog open={editingUser !== null} onOpenChange={(open) => !open && setEditingUser(null)}>
                      <DialogContent className="max-w-md bg-card border border-primary/20 backdrop-blur-md p-6 rounded-3xl shadow-elevated">
                        <DialogHeader>
                          <DialogTitle className="font-display text-xl font-bold text-primary mb-2">
                            Editar Utilizador
                          </DialogTitle>
                          <DialogDescription className="text-muted-foreground text-xs">
                            Modifique as informações do membro da AMOI.
                          </DialogDescription>
                        </DialogHeader>

                        {editingUser && (
                          <form onSubmit={handleSaveEditUser} className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-user-email" className="text-xs uppercase tracking-wider text-muted-foreground">E-mail (Não Editável)</Label>
                              <Input
                                id="edit-user-email"
                                type="email"
                                value={editingUser.email}
                                disabled
                                className="bg-muted border-border/40 text-sm cursor-not-allowed opacity-70"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-user-name" className="text-xs uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                              <Input
                                id="edit-user-name"
                                type="text"
                                placeholder="Nome do utilizador"
                                value={editUserName}
                                onChange={(e) => setEditUserName(e.target.value)}
                                className="bg-card border-border/60 text-sm focus:border-primary font-semibold text-primary font-sans"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-user-phone" className="text-xs uppercase tracking-wider text-muted-foreground">Telemóvel</Label>
                              <Input
                                id="edit-user-phone"
                                type="tel"
                                placeholder="Ex: 912345678"
                                value={editUserPhone}
                                onChange={(e) => setEditUserPhone(e.target.value)}
                                className="bg-card border-border/60 text-sm focus:border-primary font-semibold text-primary font-sans"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-user-role" className="text-xs uppercase tracking-wider text-muted-foreground">Função / Nível</Label>
                                <select
                                  id="edit-user-role"
                                  value={editUserRole}
                                  onChange={(e) => setEditUserRole(e.target.value as UserRole)}
                                  className="w-full h-10 px-3 rounded-lg border border-border/60 bg-card text-sm focus:outline-none focus:border-primary font-semibold text-primary font-sans"
                                >
                                  <option value="membro">Membro</option>
                                  <option value="Editor">Editor</option>
                                  <option value="Servo de Deus">Servo de Deus (Admin)</option>
                                </select>
                              </div>

                              <div className="flex items-center gap-2 pt-6">
                                <input
                                  id="edit-user-newsletter"
                                  type="checkbox"
                                  checked={editUserNewsletter}
                                  onChange={(e) => setEditUserNewsletter(e.target.checked)}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                                />
                                <Label htmlFor="edit-user-newsletter" className="text-xs uppercase tracking-wider text-muted-foreground cursor-pointer select-none">
                                  Newsletter
                                </Label>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingUser(null)}
                                className="border-border/60 text-muted-foreground"
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="submit"
                                className="bg-gradient-gold text-primary-foreground font-semibold shadow-gold"
                              >
                                Guardar Alterações
                              </Button>
                            </div>
                          </form>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {/* 5. WHATSAPP TAB */}
                {activeTab === "whatsapp" && (
                  <div>
                    <h2 className="text-2xl font-bold font-display text-primary flex items-center gap-2 mb-6">
                      <MessageSquare className="h-5 w-5" /> Notificações & Automação WhatsApp
                    </h2>

                    {/* Configurações do Gateway */}
                    <div className="bg-background/40 border border-primary/20 rounded-2xl p-5 mb-8">
                      <div className="font-semibold text-sm text-primary flex items-center gap-2 mb-4">
                        <Settings className="h-4 w-4" /> Configurar Gateway de Disparo
                      </div>
                      
                      <form onSubmit={handleSaveWaSettings} className="space-y-4">
                        <div className="grid sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tipo de Gateway</Label>
                            <select
                              value={waSettings.gatewayType}
                              onChange={(e) => setWaSettings({ ...waSettings, gatewayType: e.target.value as any })}
                              className="w-full h-10 px-3 rounded-lg border border-border/60 bg-card text-sm focus:outline-none focus:border-primary font-semibold text-primary font-sans"
                            >
                              <option value="link">Via Link (Gratuito / Semi-manual)</option>
                              <option value="zapi">Z-API / Evolution (Automático)</option>
                              <option value="twilio">Twilio API (Automático)</option>
                            </select>
                          </div>
                          
                          {waSettings.gatewayType === "zapi" && (
                            <>
                              <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL da Instância / Endpoint</Label>
                                <Input
                                  placeholder="https://api.z-api.io/.../send-text"
                                  value={waSettings.zapiUrl || ""}
                                  onChange={(e) => setWaSettings({ ...waSettings, zapiUrl: e.target.value })}
                                  className="bg-card border-border/60 text-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Token da Instância (Client-Token)</Label>
                                <Input
                                  type="password"
                                  placeholder="Ex: F12345ABC..."
                                  value={waSettings.zapiToken || ""}
                                  onChange={(e) => setWaSettings({ ...waSettings, zapiToken: e.target.value })}
                                  className="bg-card border-border/60 text-sm"
                                />
                              </div>
                            </>
                          )}

                          {waSettings.gatewayType === "twilio" && (
                            <>
                              <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Account SID</Label>
                                <Input
                                  placeholder="Ex: AC1234..."
                                  value={waSettings.twilioSid || ""}
                                  onChange={(e) => setWaSettings({ ...waSettings, twilioSid: e.target.value })}
                                  className="bg-card border-border/60 text-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Auth Token</Label>
                                <Input
                                  type="password"
                                  placeholder="Ex: 5abc123..."
                                  value={waSettings.twilioToken || ""}
                                  onChange={(e) => setWaSettings({ ...waSettings, twilioToken: e.target.value })}
                                  className="bg-card border-border/60 text-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Número Twilio Remetente (Sem o +)</Label>
                                <Input
                                  placeholder="Ex: +14155238886"
                                  value={waSettings.twilioFrom || ""}
                                  onChange={(e) => setWaSettings({ ...waSettings, twilioFrom: e.target.value })}
                                  className="bg-card border-border/60 text-sm"
                                />
                              </div>
                            </>
                          )}
                        </div>

                        <Button type="submit" className="bg-gradient-gold text-primary-foreground font-semibold shadow-gold text-xs px-4 py-2">
                          <Save className="mr-2 h-4 w-4" /> Guardar Configuração
                        </Button>
                      </form>
                    </div>

                    {/* Modelo da Mensagem */}
                    <div className="bg-background/40 border border-primary/20 rounded-2xl p-5 mb-8 space-y-4">
                      <div className="font-semibold text-sm text-primary flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4" /> Mensagem a Enviar
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed bg-card/60 p-3.5 rounded-xl border border-border/40">
                        Pode usar variáveis dinâmicas no texto:<br/>
                        * <strong>{`{nome}`}</strong> - Substitui pelo Nome Completo do membro.<br/>
                        * <strong>{`{email}`}</strong> - Substitui pelo E-mail.<br/>
                        * <strong>{`{telefone}`}</strong> - Substitui pelo Telemóvel.
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="wa-text" className="text-xs uppercase tracking-wider text-muted-foreground">Texto do Modelo</Label>
                        <Textarea
                          id="wa-text"
                          rows={4}
                          value={waTemplate}
                          onChange={(e) => setWaTemplate(e.target.value)}
                          placeholder="Olá {nome}! Lembramos que hoje..."
                          className="bg-card border-border/60 min-h-[100px] text-sm"
                        />
                      </div>
                    </div>

                    {/* Destinatários e Ações */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="font-semibold text-sm text-muted-foreground">
                          Destinatários ({usersList.filter(u => u.phone).length} membros com número)
                        </div>
                        
                        <Button
                          type="button"
                          onClick={handleBulkSendWa}
                          disabled={waSending || usersList.filter(u => u.phone && waSelectedUsers[u.uid]).length === 0}
                          className="bg-gradient-gold text-primary-foreground font-semibold shadow-gold w-full sm:w-auto text-xs py-2 px-4 h-10"
                        >
                          {waSending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A disparar...</>
                          ) : (
                            <><Send className="mr-2 h-4 w-4" /> Disparar para todos selecionados</>
                          )}
                        </Button>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-border/60">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-muted/40 border-b border-border/60">
                              <th className="p-4 w-12 text-center">
                                <input
                                  type="checkbox"
                                  checked={usersList.filter(u => u.phone).length > 0 && usersList.filter(u => u.phone).every(u => waSelectedUsers[u.uid])}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    const next: Record<string, boolean> = {};
                                    usersList.forEach(u => {
                                      if (u.phone) next[u.uid] = checked;
                                    });
                                    setWaSelectedUsers(next);
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
                                />
                              </th>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Membro</th>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Telemóvel</th>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Visualização da Mensagem</th>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Estado</th>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usersList.filter(u => u.phone).length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                  Nenhum membro com número de telemóvel registado.
                                </td>
                              </tr>
                            ) : (
                              usersList
                                .filter(u => u.phone)
                                .map((usr) => {
                                  const status = waStatus[usr.uid] || "pending";
                                  const isSelected = !!waSelectedUsers[usr.uid];
                                  const preview = replacePlaceholders(waTemplate, usr);

                                  return (
                                    <tr key={usr.uid} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                                      <td className="p-4 text-center">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            setWaSelectedUsers(prev => ({ ...prev, [usr.uid]: e.target.checked }));
                                          }}
                                          className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
                                        />
                                      </td>
                                      <td className="p-4 font-semibold text-foreground">
                                        {usr.displayName}
                                      </td>
                                      <td className="p-4 text-muted-foreground font-mono">
                                        {usr.phone}
                                      </td>
                                      <td className="p-4 max-w-xs text-xs text-muted-foreground/80 truncate" title={preview}>
                                        {preview}
                                      </td>
                                      <td className="p-4">
                                        {status === "pending" && (
                                          <span className="text-xs text-muted-foreground">Pendente</span>
                                        )}
                                        {status === "sending" && (
                                          <span className="text-xs text-primary animate-pulse flex items-center gap-1">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> A enviar
                                          </span>
                                        )}
                                        {status === "success" && (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 text-[10px] font-bold">
                                            Enviado ✔️
                                          </span>
                                        )}
                                        {status === "error" && (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/25 text-[10px] font-bold">
                                            Erro ❌
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-4 text-right">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => sendSingleMessage(usr)}
                                          disabled={waSending}
                                          className="text-xs border-primary/40 text-primary hover:bg-primary/10 h-7 px-3"
                                        >
                                          Enviar Individual
                                        </Button>
                                      </td>
                                    </tr>
                                  );
                                })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. VIDEOS TAB */}
                {activeTab === "videos" && (
                  <div>
                    <h2 className="text-2xl font-bold font-display text-primary flex items-center gap-2 mb-6">
                      <Video className="h-5 w-5" /> Gestão de Cultos & Vídeos (YouTube & Curtos)
                    </h2>

                    {/* Formulário de Adicionar / Editar */}
                    <div id="video-form-section" className="bg-background/40 border border-primary/20 rounded-2xl p-5 mb-8">
                      <div className="font-semibold text-sm text-primary flex items-center gap-2 mb-4">
                        {editingVideoId ? <Pencil className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                        {editingVideoId ? "Editar Vídeo / Clip" : "Adicionar Novo Vídeo ou Clip"}
                      </div>
                      
                      <form onSubmit={handleSaveVideo} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Título do Vídeo</Label>
                            <Input
                              placeholder="Ex: O Poder da Fé ou Louvor de Domingo"
                              value={videoTitle}
                              onChange={(e) => setVideoTitle(e.target.value)}
                              className="bg-card border-border/60"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Pregador / Orador / Grupo</Label>
                            <Input
                              placeholder="Ex: Pastor Nelson Nunes ou Ministério de Louvor"
                              value={videoSpeaker}
                              onChange={(e) => setVideoSpeaker(e.target.value)}
                              className="bg-card border-border/60"
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Data de Publicação</Label>
                            <Input
                              type="date"
                              value={videoDate}
                              onChange={(e) => setVideoDate(e.target.value)}
                              className="bg-card border-border/60"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Categoria</Label>
                            <select
                              value={videoCategory}
                              onChange={(e) => setVideoCategory(e.target.value as ChurchVideo["category"])}
                              className="w-full rounded-md border border-border/60 bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <option value="Pregação">Pregação</option>
                              <option value="Louvor">Louvor</option>
                              <option value="Vigília">Vigília</option>
                              <option value="Especial">Especial</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tipo de Vídeo</Label>
                            <select
                              value={videoType}
                              onChange={(e) => setVideoType(e.target.value as ChurchVideo["type"])}
                              className="w-full rounded-md border border-border/60 bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <option value="youtube">Vídeo do YouTube (Longo)</option>
                              <option value="short">Clip Vertical (Short / TikTok / Reel)</option>
                            </select>
                          </div>
                        </div>

                        {videoType === "youtube" ? (
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">ID do Vídeo no YouTube</Label>
                            <Input
                              placeholder="Ex: dQw4w9WgXcQ (Apenas o código no final do URL do vídeo)"
                              value={videoYoutubeId}
                              onChange={(e) => setVideoYoutubeId(e.target.value)}
                              className="bg-card border-border/60"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL do Vídeo Curto (TikTok, Short ou Reel)</Label>
                            <Input
                              placeholder="Cole o link completo. Ex: https://www.tiktok.com/@ministerioamoi/video/72589..."
                              value={videoShortUrl}
                              onChange={(e) => setVideoShortUrl(e.target.value)}
                              className="bg-card border-border/60"
                            />
                            <p className="text-[10px] text-muted-foreground font-semibold">
                              * Suporta links do YouTube Shorts, TikTok e Instagram Reels. O sistema converterá automaticamente para embed.
                            </p>
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                          {editingVideoId && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingVideoId(null);
                                setVideoTitle("");
                                setVideoSpeaker("");
                                setVideoDate(new Date().toISOString().split("T")[0]);
                                setVideoCategory("Pregação");
                                setVideoType("youtube");
                                setVideoYoutubeId("");
                                setVideoShortUrl("");
                              }}
                              className="border-border/60 text-muted-foreground cursor-pointer"
                            >
                              Cancelar
                            </Button>
                          )}
                          <Button
                            type="submit"
                            disabled={savingVideo}
                            className="bg-gradient-gold text-primary-foreground font-semibold shadow-gold cursor-pointer"
                          >
                            {savingVideo ? "A Guardar..." : editingVideoId ? "Atualizar Vídeo" : "Adicionar Vídeo"}
                          </Button>
                        </div>
                      </form>
                    </div>

                    {/* Tabela de Vídeos Existentes */}
                    <div className="bg-background/40 border border-primary/20 rounded-2xl p-5">
                      <div className="font-semibold text-sm text-primary mb-4 flex items-center gap-2">
                        <Video className="h-4 w-4" /> Lista de Vídeos e Clipes ({videos.length})
                      </div>

                      {videos.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Nenhum vídeo registado.</p>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-border/60">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="bg-muted/40 border-b border-border/60">
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Título</th>
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Pregador</th>
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Data</th>
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Categoria</th>
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Tipo</th>
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Identificador</th>
                                <th className="p-4 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {videos.map((vid) => (
                                <tr key={vid.id} className="border-b border-border/40 hover:bg-card/25 transition-colors">
                                  <td className="p-4 font-medium text-foreground max-w-xs truncate" title={vid.title}>
                                    {vid.title}
                                  </td>
                                  <td className="p-4 text-muted-foreground">{vid.speaker}</td>
                                  <td className="p-4 text-muted-foreground text-xs">{vid.date}</td>
                                  <td className="p-4 text-xs font-semibold text-primary">{vid.category}</td>
                                  <td className="p-4">
                                    {vid.type === "short" ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-primary border border-secondary/35 text-[10px] font-bold">
                                        <Smartphone className="h-3 w-3" /> Clip Vertical
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/25 text-[10px] font-bold">
                                        <Youtube className="h-3 w-3" /> YouTube Longo
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 text-xs text-muted-foreground font-mono truncate max-w-[120px]" title={vid.type === "youtube" ? vid.youtubeId : vid.shortUrl}>
                                    {vid.type === "youtube" ? vid.youtubeId : vid.shortUrl}
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex justify-end items-center gap-2">
                                      <button
                                        onClick={() => handleStartEditVideo(vid)}
                                        className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 hover:text-primary transition-all cursor-pointer"
                                        title="Editar"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteVideo(vid.id)}
                                        className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/25 hover:text-red-600 transition-all cursor-pointer"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 7. SERVANTS TAB */}
                {activeTab === "servants" && (
                  <div>
                    <h2 className="text-2xl font-bold font-display text-primary flex items-center gap-2 mb-6">
                      <Users className="h-5 w-5" /> Gestão de Servos & Departamentos (O Chamado)
                    </h2>

                    {/* Formulário de Adicionar / Editar */}
                    <div id="servant-form-section" className="bg-background/40 border border-primary/20 rounded-2xl p-5 mb-8">
                      <div className="font-semibold text-sm text-primary flex items-center gap-2 mb-4">
                        {editingServantId ? <Pencil className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                        {editingServantId ? "Editar Servo / Irmão" : "Adicionar Novo Servo / Irmão"}
                      </div>
                      
                      <form onSubmit={handleSaveServant} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                            <Input
                              placeholder="Ex: Anciã Sandra Congo ou Irmão Mateus"
                              value={servantName}
                              onChange={(e) => setServantName(e.target.value)}
                              className="bg-card border-border/60"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cargo / Função Ministerial</Label>
                            <Input
                              placeholder="Ex: Coordenadora do Ministério Infantil ou Tesoureiro"
                              value={servantRole}
                              onChange={(e) => setServantRole(e.target.value)}
                              className="bg-card border-border/60"
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Departamento</Label>
                            <select
                              value={servantDept}
                              onChange={(e) => setServantDept(e.target.value)}
                              className="w-full rounded-md border border-border/60 bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              {SERVANT_DEPARTMENTS.map((dept) => (
                                <option key={dept} value={dept}>{dept}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Foto (URL de imagem ou link Google Drive)</Label>
                            <Input
                              placeholder="Ex: https://drive.google.com/file/d/... ou deixe vazio"
                              value={servantImg}
                              onChange={(e) => setServantImg(e.target.value)}
                              className="bg-card border-border/60"
                            />
                            <p className="text-[10px] text-muted-foreground font-semibold">
                              * Dica: Pode usar palavras-chave como `pastor-nelson`, `ancia-isabel`, `pastor-nicolau`, `ancia-rosalina`, `diaconisa-judith` para usar as fotos padrão dos líderes!
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Biografia / Descrição Curta</Label>
                          <textarea
                            rows={3}
                            placeholder="Escreva uma breve descrição das tarefas ou da missão do servo..."
                            value={servantBio}
                            onChange={(e) => setServantBio(e.target.value)}
                            className="w-full rounded-md border border-border/60 bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          {editingServantId && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingServantId(null);
                                setServantName("");
                                setServantRole("");
                                setServantDept("Departamento Administrativo");
                                setServantBio("");
                                setServantImg("");
                              }}
                              className="border-border/60 text-muted-foreground cursor-pointer"
                            >
                              Cancelar
                            </Button>
                          )}
                          <Button
                            type="submit"
                            disabled={savingServant}
                            className="bg-gradient-gold text-primary-foreground font-semibold shadow-gold cursor-pointer"
                          >
                            {savingServant ? "A Guardar..." : editingServantId ? "Atualizar Servo" : "Adicionar Servo"}
                          </Button>
                        </div>
                      </form>
                    </div>

                    {/* Tabela de Servos Existentes */}
                    <div className="bg-background/40 border border-primary/20 rounded-2xl p-5">
                      <div className="font-semibold text-sm text-primary mb-4 flex items-center gap-2">
                        <Users className="h-4 w-4" /> Lista de Servos e Cargos ({servantsList.length})
                      </div>

                      {servantsList.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Nenhum servo registado.</p>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-border/60">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="bg-muted/40 border-b border-border/60">
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Nome</th>
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Função / Cargo</th>
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Departamento</th>
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Biografia</th>
                                <th className="p-4 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {servantsList.map((srv) => (
                                <tr key={srv.id} className="border-b border-border/40 hover:bg-card/25 transition-colors">
                                  <td className="p-4 font-medium text-foreground">{srv.name}</td>
                                  <td className="p-4 text-primary font-semibold text-xs">{srv.role}</td>
                                  <td className="p-4 text-muted-foreground text-xs">{srv.dept}</td>
                                  <td className="p-4 text-muted-foreground text-xs max-w-xs truncate" title={srv.bio}>{srv.bio}</td>
                                  <td className="p-4 text-right">
                                    <div className="flex justify-end items-center gap-2">
                                      <button
                                        onClick={() => handleStartEditServant(srv)}
                                        className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 hover:text-primary transition-all cursor-pointer"
                                        title="Editar"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteServant(srv.id)}
                                        className="p-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-500 hover:bg-red-500/20 hover:text-red-500 transition-all cursor-pointer"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
