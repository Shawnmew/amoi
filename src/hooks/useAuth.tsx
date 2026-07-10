import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export type UserRole = "membro" | "Editor" | "Servo de Deus" | "Secretaria" | "Bravo" | "Banda";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  newsletter: boolean;
}

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  isMock: boolean;
  loginMock: (email: string, name: string, role: UserRole, newsletter: boolean) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  isMock: false,
  loginMock: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    // 1. Se o Firebase estiver ativo e configurado
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (u) => {
        if (u) {
          let role: UserRole = "membro";
          let newsletter = false;

          if (db) {
            try {
              const uDoc = await getDoc(doc(db, "users", u.uid));
              if (uDoc.exists()) {
                const data = uDoc.data();
                if (data.role) role = data.role as UserRole;
                if (typeof data.newsletter === "boolean") newsletter = data.newsletter;
              }
            } catch (e) {
              console.error("Error loading user profile:", e);
            }
          }

          setUser({
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            role,
            newsletter,
          });
        } else {
          setUser(null);
        }
        setIsMock(false);
        setLoading(false);
      });
      return () => unsubscribe();
    }

    // 2. Se o Firebase NÃO estiver ativo (Modo Mock/Local)
    setIsMock(true);
    if (typeof window !== "undefined") {
      const localUser = localStorage.getItem("amoi_mock_user");
      if (localUser) {
        try {
          setUser(JSON.parse(localUser));
        } catch {
          setUser(null);
        }
      }

      // Semeia base de usuários de teste padrão se algum estiver em falta
      let mockDbList: any[] = [];
      const mockDb = localStorage.getItem("amoi_mock_users_db");
      if (mockDb) {
        try {
          mockDbList = JSON.parse(mockDb);
        } catch {}
      }

      const hasEditor = mockDbList.some((u: any) => u.email === "editor@amoi.org");
      const hasMembro = mockDbList.some((u: any) => u.email === "membro@amoi.org");
      const hasAdmin = mockDbList.some((u: any) => u.email === "admin@amoi.org");
      const hasSecretaria = mockDbList.some((u: any) => u.email === "secretaria@amoi.org");
      const hasBravo = mockDbList.some((u: any) => u.email === "bravo@amoi.org");
      const hasBanda = mockDbList.some((u: any) => u.email === "banda@amoi.org");

      if (!hasAdmin || !hasEditor || !hasMembro || !hasSecretaria || !hasBravo || !hasBanda) {
        const defaultUsers = [
          { uid: "mock-uid-admin", email: "admin@amoi.org", password: "admin", name: "Pastor Nelson Nunes", role: "Servo de Deus", newsletter: true, phone: "912345678" },
          { uid: "mock-uid-editor", email: "editor@amoi.org", password: "editor", name: "Diácono João", role: "Editor", newsletter: false, phone: "923456789" },
          { uid: "mock-uid-secretaria", email: "secretaria@amoi.org", password: "secretaria", name: "Secretária Júlia", role: "Secretaria", newsletter: true, phone: "945678901" },
          { uid: "mock-uid-bravo", email: "bravo@amoi.org", password: "bravo", name: "Bravo Guerreiro", role: "Bravo", newsletter: true, phone: "956789012" },
          { uid: "mock-uid-banda", email: "banda@amoi.org", password: "banda", name: "Líder de Louvor Banda", role: "Banda", newsletter: true, phone: "967890123" },
          { uid: "mock-uid-membro", email: "membro@amoi.org", password: "membro", name: "Irmã Maria Silva", role: "membro", newsletter: true, phone: "934567890" }
        ];

        const mergedList = [...mockDbList];
        defaultUsers.forEach(defU => {
          const existingIdx = mergedList.findIndex(u => u.email === defU.email);
          if (existingIdx === -1) {
            mergedList.push(defU);
          } else {
            // Atualiza campos em falta do admin antigo
            mergedList[existingIdx] = { ...defU, ...mergedList[existingIdx], role: mergedList[existingIdx].role || defU.role };
          }
        });

        localStorage.setItem("amoi_mock_users_db", JSON.stringify(mergedList));
      }
    }
    setLoading(false);
  }, []);

  const loginMock = (email: string, name: string, role: UserRole, newsletter: boolean) => {
    const mockUser: AuthUser = {
      uid: "mock-uid-" + Date.now(),
      email,
      displayName: name,
      role,
      newsletter,
    };
    setUser(mockUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("amoi_mock_user", JSON.stringify(mockUser));
    }
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    } else {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("amoi_mock_user");
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, isMock, loginMock }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}


